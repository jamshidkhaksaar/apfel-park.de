#!/usr/bin/env bash
# Deploy the Apfel Park Next.js app from a committed, pushed git ref.
#
#   deploy-app.sh <ref>    # explicit committed, pushed ref required
#   ALLOW_NON_FORWARD_DEPLOY=1 deploy-app.sh <ref>  # intentional rollback only
#
# Why this exists: releases used to be made by copying the previous release
# directory and editing it in place. Every release dir ended up a dirty git
# checkout, and on 2026-08-03 that had stranded ~2 weeks of work (141 files)
# that existed nowhere but this VPS. This script only ever builds from a commit
# that is reachable from origin, so the deployed tree always has a name.

set -euo pipefail
umask 022

APP_ROOT=/srv/apfel-park/app
SOURCE="$APP_ROOT/source"
RELEASES="$APP_ROOT/releases"
CURRENT="$APP_ROOT/current"
ENV_FILE="$APP_ROOT/shared/app.env"
SERVICE=apfel-park-nextjs
WORKER_SERVICE=apfel-park-marketplace-worker.service
TELEGRAM_WORKER_SERVICE=apfel-park-telegram-worker.service
BASE_URL=http://127.0.0.1:3000
KEEP=3

export PATH=/root/.nvm/versions/node/v24.14.0/bin:$PATH

log() { printf '[deploy] %s\n' "$*"; }
die() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

[ "$#" -eq 1 ] && [ -n "$1" ] || die "usage: deploy-app.sh <explicit git ref>; no implicit branch deployment"
TARGET_CHECK="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/check-deploy-target.sh"

[ -f "$ENV_FILE" ]    || die "missing env file: $ENV_FILE"
[ -d "$SOURCE/.git" ] || die "missing source clone at $SOURCE"

log "fetching origin"
git -C "$SOURCE" fetch origin --prune --tags --quiet

ref="$1"
sha="$(git -C "$SOURCE" rev-parse --verify "$ref^{commit}" 2>/dev/null)" \
  || die "ref not found: $ref"
export DEPLOYMENT_VERSION="$sha"
live_sha="$(cat "$CURRENT/.deployed-sha" 2>/dev/null || true)"
bash "$TARGET_CHECK" "$SOURCE" "$live_sha" "$sha" || die "deployment target failed the forward-release check"

# Refuse a commit that exists only locally -- deploying it would recreate the
# exact "it only lives on the VPS" problem this script was written to prevent.
git -C "$SOURCE" branch -r --contains "$sha" 2>/dev/null | grep -q . \
  || die "commit ${sha:0:8} is not on any origin branch -- push it first"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
short="$(git -C "$SOURCE" rev-parse --short "$sha")"
release="$RELEASES/$stamp-$short"

log "deploying $ref ($short)"
mkdir -p "$release"
# git archive exports tracked files only: no node_modules, no stray edits.
git -C "$SOURCE" archive "$sha" | tar -x -C "$release"
printf '%s\n' "$sha" > "$release/.deployed-sha"

cd "$release"
log "npm ci"
# --include=dev because an inherited NODE_ENV=production makes npm skip
# devDependencies, which silently removes vitest and fails the test gate.
npm ci --no-audit --no-fund --include=dev

# Gate the release on the test suite. This runs before anything touches the
# `current` symlink, so a failure leaves production untouched.
log "npm test"
npm test

log "npm run lint"
npm run lint

log "npm run typecheck"
npm run typecheck

log "npm run audit:unused"
npm run audit:unused

log "npm audit --audit-level=high"
npm audit --audit-level=high

log "npm run build"
set -a; . "$ENV_FILE"; set +a
npm run build

# Use an isolated standalone process and temporary upload directory to verify
# images added after startup. A symlink alone only covers pre-existing files.
log "runtime image upload regression"
npm run test:image-uploads

# Apply additive schema changes before switching the live symlink. A failed
# migration stops the release here; the currently running app remains active.
# Migrations are transactional and recorded in schema_migrations.
log "database migrations"
if [ -x "$release/deployment/vps/product-intake/apply-owner-migration.sh" ]; then
  bash "$release/deployment/vps/product-intake/apply-owner-migration.sh"
fi
npm run db:migrate

# `next build` does NOT copy these into .next/standalone. Forgetting it yields
# a site that returns 200 with no CSS and no JS -- silent, and easy to miss.
log "copying static assets into standalone"
cp -r "$release/.next/static" "$release/.next/standalone/.next/static"
cp -r "$release/public/." "$release/.next/standalone/public/"

# Uploads live outside releases and nginx serves them via alias. Keep the
# public symlink for files present at boot. The /uploads/[...path] route also
# lets next/image read raster images uploaded after Next's public snapshot.
ln -sfn "$APP_ROOT/shared/uploads" "$release/.next/standalone/public/uploads"

# Nginx serves .next/static directly. Make the release path traversable and
# static build artifacts readable even when the invoking shell had umask 077.
chmod 0755 "$release" "$release/.next"
chmod -R a+rX "$release/.next/static"

# nginx serves this shared archive, not the current-release symlink. Seed every
# retained release before activation so cached HTML continues to find its assets.
log "preserving immutable assets across deployments"
bash "$release/deployment/vps/scripts/preserve-static-assets.sh" \
  "$APP_ROOT/shared/next-static" "$RELEASES"/*/.next/static "$release/.next/static"

previous="$(readlink -e "$CURRENT" 2>/dev/null || true)"
live_sha="$(cat "$CURRENT/.deployed-sha" 2>/dev/null || true)"
bash "$TARGET_CHECK" "$SOURCE" "$live_sha" "$sha" || die "live release changed during the build; refusing to overwrite it"
worker_present=0
if systemctl cat "$WORKER_SERVICE" >/dev/null 2>&1; then worker_present=1; fi
telegram_worker_present=0
if systemctl cat "$TELEGRAM_WORKER_SERVICE" >/dev/null 2>&1; then telegram_worker_present=1; fi

http_code() {
  curl -sS --connect-timeout 3 --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL$1"
}

wait_for_web() {
  local attempt
  for attempt in {1..20}; do
    [ "$(http_code /de || true)" = "200" ] && return 0
    sleep 2
  done
  return 1
}

services_active() {
  systemctl is-active --quiet "$SERVICE" || return 1
  if [ "$worker_present" = 1 ]; then
    systemctl is-active --quiet "$WORKER_SERVICE" || return 1
  fi
  if [ "$telegram_worker_present" = 1 ] && [ -f "$CURRENT/scripts/telegram-product-worker.ts" ]; then
    systemctl is-active --quiet "$TELEGRAM_WORKER_SERVICE" || return 1
  fi
}

# Arm before the atomic switch; compare the link in the handler so a failed
# pre-switch ln/mv never restarts the old service. EXIT also catches explicit
# die and set -e failures, unlike an ERR-only trap. Signals become failures.
activation_pending=1
rollback_on_exit() {
  local status=$? rollback_failed=0
  trap - EXIT INT TERM
  if [ "$status" -eq 0 ] || [ "$activation_pending" -ne 1 ] ||
     [ "$(readlink -f "$CURRENT" 2>/dev/null || true)" != "$release" ]; then
    exit "$status"
  fi
  log "activation FAILED; failed release $release retained for inspection"
  # This marker survives later successful deploys; operator removes it only
  # after investigation. Code rollback NEVER reverses database migrations.
  touch "$release/.deploy-failed" || true
  if [ -z "$previous" ] || [ ! -d "$previous" ]; then
    log "ERROR: no previous release to roll back to; manual recovery required"
    exit "$status"
  fi
  log "rolling back to $previous"
  if ! ln -sfn "$previous" "$CURRENT.tmp" || ! mv -Tf "$CURRENT.tmp" "$CURRENT"; then
    log "ERROR: rollback link restoration FAILED; manual recovery required"
    exit "$status"
  fi
  # Try both services and health even if one restart fails; never recurse.
  systemctl restart "$SERVICE" || rollback_failed=1
  if [ "$worker_present" = 1 ]; then
    systemctl restart "$WORKER_SERVICE" || rollback_failed=1
  fi
  if [ "$telegram_worker_present" = 1 ]; then
    if [ -f "$CURRENT/scripts/telegram-product-worker.ts" ]; then
      systemctl restart "$TELEGRAM_WORKER_SERVICE" || rollback_failed=1
    else
      systemctl stop "$TELEGRAM_WORKER_SERVICE" || rollback_failed=1
    fi
  fi
  wait_for_web || rollback_failed=1
  services_active || rollback_failed=1
  if [ "$rollback_failed" = 0 ]; then
    log "rollback verified healthy; $release kept for inspection"
  else
    log "ERROR: rollback health/restart FAILED; manual recovery required"
  fi
  exit "$status"
}
trap rollback_on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

log "activating (previous: ${previous:-none})"
ln -sfn "$release" "$CURRENT.tmp"
mv -Tf "$CURRENT.tmp" "$CURRENT"
systemctl restart "$SERVICE"
if [ "$worker_present" = 1 ]; then
  systemctl restart "$WORKER_SERVICE"
fi
if [ "$telegram_worker_present" = 1 ]; then
  systemctl restart "$TELEGRAM_WORKER_SERVICE"
fi

log "health check"
wait_for_web || die "web health check failed"
services_active || die "service is not active after deployment"

# GET-only critical smoke: no login, cart mutation, order, or payment request.
expect_http() {
  local path=$1 expected=$2 code
  code="$(http_code "$path" || true)"
  [ "$code" = "$expected" ] || die "$path returned $code, expected $expected"
}
expect_http /xx 404
expect_http / 308
for locale in de en; do
  for page in "" /store /cart /checkout; do
    expect_http "/$locale$page" 200
  done
done
# Select a current product link without credentials or guessing a stale slug.
# An empty catalog is not a valid production storefront smoke fixture.
product_path="$(curl -fsS --connect-timeout 3 --max-time 10 "$BASE_URL/de/store" | node -e '
  let html = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", chunk => { html += chunk; });
  process.stdin.on("end", () => {
    const match = html.match(/href="(\/de\/store\/[A-Za-z0-9%_-]+)"/);
    if (!match) process.exit(1);
    process.stdout.write(match[1]);
  });
')" || die "could not discover a product for smoke"
expect_http "$product_path" 200
# This uncached route performs a DB-backed lookup and returns 503 on DB errors.
expect_http /api/public/product-route/deploy-smoke-nonexistent 200
expect_http /admin 307

# Probe real generated JS and CSS, including the deploymentId query used by
# Next. The public HTTPS probe also exercises nginx/CDN asset routing (not just
# the standalone copy). Keep TLS verification enabled and all requests bounded.
for extension in js css; do
  asset="$(find "$release/.next/static" -type f -name "*.$extension" -print -quit)"
  [ -n "$asset" ] || die "no generated $extension asset"
  asset_path="/_next/static/${asset#"$release/.next/static/"}?dpl=$sha"
  expect_http "$asset_path" 200
  code="$(curl -sS --connect-timeout 3 --max-time 10 -o /dev/null -w '%{http_code}' "https://apfel-park.de$asset_path" || true)"
  [ "$code" = 200 ] || die "public $extension asset returned $code"
done

# Older builds' hashed assets must keep resolving, and a missing asset must
# never be advertised as cacheable. Both are properties of the proxy in front of
# the app, and both fail silently from outside: the CDN answers from its own
# cache, and `add_header Cache-Control ... always` once made a transient 404
# "public, max-age=2592000, immutable", which the edge then served for a month.
# Probe the origin directly (--resolve) so cached edge responses cannot hide a
# broken nginx, exactly as they did when the /_next/static alias was changed to
# point at the current release and every older asset 404ed behind a warm cache.
origin_https() {
  curl -sS --resolve apfel-park.de:443:127.0.0.1 --connect-timeout 3 --max-time 10 "$@"
}

log "older release asset continuity"
probed_releases=0
for old in "$RELEASES"/*/; do
  old="${old%/}"
  [ -d "$old" ] || continue
  # The release being activated is covered by the probes above.
  if [ "$(readlink -f "$old")" = "$release" ]; then continue; fi
  # A failed release never served traffic and is kept for inspection only.
  if [ -f "$old/.deploy-failed" ]; then continue; fi
  old_asset="$(find "$old/.next/static" -type f -name '_buildManifest.js' -print -quit 2>/dev/null || true)"
  [ -n "$old_asset" ] \
    || old_asset="$(find "$old/.next/static" -type f -name '*.js' -print -quit 2>/dev/null || true)"
  if [ -z "$old_asset" ]; then
    log "  $(basename "$old"): no static assets to probe"
    continue
  fi
  old_path="/_next/static/${old_asset#"$old/.next/static/"}"
  code="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$old_path" || true)"
  [ "$code" = 200 ] || die "older release $(basename "$old") no longer serves $old_path ($code); the /_next/static alias must keep serving the shared archive"
  probed_releases=$((probed_releases + 1))
  log "  $(basename "$old") -> $old_path 200"
done
if [ "$probed_releases" -eq 0 ]; then
  log "  WARNING: no retained release with assets to probe"
fi

log "missing asset caching"
missing_path="/_next/static/deploy-probe-$short-missing.js"
missing_code="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$missing_path" || true)"
[ "$missing_code" = 404 ] || die "missing asset $missing_path returned $missing_code, expected 404"
missing_cache_control="$(origin_https -o /dev/null -D - "https://apfel-park.de$missing_path" | tr -d '\r' | grep -i '^cache-control:' || true)"
if printf '%s' "$missing_cache_control" | grep -qi 'immutable'; then
  die "missing asset $missing_path is served as immutable: $missing_cache_control"
fi
for max_age in $(printf '%s' "$missing_cache_control" | grep -oE 'max-age=[0-9]+' | cut -d= -f2 || true); do
  if [ "$max_age" -ge 86400 ]; then
    die "missing asset $missing_path is cached for ${max_age}s: $missing_cache_control"
  fi
done
log "  $missing_path -> 404, no long-lived caching"

# The markdown twins are what crawlers and AI agents read instead of the HTML,
# and they are also the URLs Next rewrites internally: it copies the rewrite
# destination onto the response as x-middleware-rewrite, so a regression here
# either serves HTML to an agent or publishes http://localhost:3000/api/md/...
# to the world. Probed on the origin for the same reason as the assets above.
origin_header() {
  local path=$1 name=$2
  shift 2
  origin_https -o /dev/null -D - "$@" "https://apfel-park.de$path" \
    | tr -d '\r' | grep -i "^$name:" | head -n1 \
    | sed -E "s/^[^:]*:[[:space:]]*//" || true
}

log "markdown twins"
# Take the probe path from the route table the app itself ships, so renaming a
# page cannot turn this check into a false failure.
twin_path="$(grep -oE "pattern: '/[a-z0-9-]+', kind: 'content'" "$release/src/lib/md/routes.ts" \
  | head -n1 | sed -E "s/pattern: '([^']*)'.*/\1/" || true)"
[ -n "$twin_path" ] \
  || die "could not derive a content markdown twin from $release/src/lib/md/routes.ts"
twin_md="/de$twin_path.md"
twin_html="/de$twin_path"

# 1. The .md URL is markdown, whatever the client says it accepts.
md_status="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$twin_md" || true)"
[ "$md_status" = 200 ] || die "$twin_md returned $md_status, expected 200"
md_type="$(origin_header "$twin_md" content-type)"
case "$md_type" in
  *text/markdown*) ;;
  *) die "$twin_md is not markdown: ${md_type:-no content-type}" ;;
esac

# 2. The same URL still serves HTML, and swaps to markdown only for a client
#    that asks with a strictly higher q-value than text/html.
html_status="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$twin_html" || true)"
[ "$html_status" = 200 ] || die "$twin_html returned $html_status, expected 200"
html_type="$(origin_header "$twin_html" content-type)"
case "$html_type" in
  *text/html*) ;;
  *) die "$twin_html is not HTML: ${html_type:-no content-type}" ;;
esac
negotiated_type="$(origin_header "$twin_html" content-type -H 'Accept: text/markdown')"
case "$negotiated_type" in
  *text/markdown*) ;;
  *) die "$twin_html did not negotiate to markdown for Accept: text/markdown (${negotiated_type:-no content-type})" ;;
esac

# 3. Neither markdown response may name the internal upstream.
leaked="$(origin_header "$twin_md" x-middleware-rewrite)"
[ -z "$leaked" ] || die "$twin_md leaks the internal rewrite target: $leaked"
leaked="$(origin_header "$twin_html" x-middleware-rewrite -H 'Accept: text/markdown')"
[ -z "$leaked" ] || die "$twin_html leaks the internal rewrite target: $leaked"

# 4. One URL carries two representations, so a response a shared cache may store
#    has to list Accept in Vary; without it a CDN cannot tell them apart and
#    hands markdown to a browser (or HTML to an agent) that asked for the other.
#    Responses that forbid shared caching (no-store/private) are exempt, which
#    is why the plain HTML page carries no token today.
vary_checked=0
require_accept_vary() {
  local path=$1 cache_control vary token
  shift
  cache_control="$(origin_header "$path" cache-control "$@")"
  case "$cache_control" in
    *no-store*|*private*) return 0 ;;
  esac
  vary_checked=$((vary_checked + 1))
  vary="$(origin_header "$path" vary "$@")"
  # Compare tokens, not substrings: Accept-Encoding must not pass for Accept.
  for token in $(printf '%s' "$vary" | tr ',' ' ' | tr 'A-Z' 'a-z'); do
    [ "$token" = "accept" ] && return 0
  done
  die "$path is cacheable (${cache_control:-no cache-control}) but Vary does not list Accept: ${vary:-no vary}"
}

require_accept_vary "$twin_md"
require_accept_vary "$twin_html"
require_accept_vary "$twin_html" -H 'Accept: text/markdown'
if [ "$vary_checked" -eq 0 ]; then
  log "  WARNING: no probed response is shared-cacheable; the Vary rule checked nothing"
else
  log "  $vary_checked shared-cacheable response(s) list Accept in Vary"
fi

# 5. A .md URL with no twin must answer a markdown 404 that no cache may keep.
#    An agent asking for markdown would otherwise get an HTML error page, and a
#    cached 404 outlives the release that caused it -- a page whose twin lands in
#    the next deploy would stay broken at the edge until the cache expired.
no_twin="/de/no-twin-$short.md"
no_twin_status="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$no_twin" || true)"
[ "$no_twin_status" = 404 ] || die "$no_twin returned $no_twin_status, expected 404"
no_twin_type="$(origin_header "$no_twin" content-type)"
case "$no_twin_type" in
  *text/markdown*) ;;
  *) die "$no_twin is not a markdown response: ${no_twin_type:-no content-type}" ;;
esac
no_twin_cache="$(origin_header "$no_twin" cache-control)"
case "$no_twin_cache" in
  *no-store*) ;;
  *) die "$no_twin is cacheable (${no_twin_cache:-no cache-control}); a cached 404 outlives the release that caused it" ;;
esac

log "  $twin_md -> ${md_type:-?}"
log "  $twin_html -> ${html_type:-?}, and ${negotiated_type:-?} for Accept: text/markdown"
log "  $twin_md and $twin_html expose no x-middleware-rewrite"
log "  $no_twin -> 404 markdown, no-store"

# Activation is committed only after every critical check. Optional indexing
# and retention failures must not undo an already healthy release.
activation_pending=0

# Tell Bing, Yandex, Seznam and Naver the content changed. The key file has
# been served since July but nothing ever submitted to it. The script skips
# automatically when the sitemap fingerprint is unchanged, so repeated deploys
# do not spam. Non-fatal: a failed submission must not fail a deploy.
log "indexnow"
if INDEXNOW_STATE="$APP_ROOT/shared/indexnow-state.json" node scripts/indexnow.mjs; then :; else
  log "  WARNING: IndexNow submission failed (non-fatal)"
fi

log "pruning old releases (keeping $KEEP)"
ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  [ "$(readlink -f "$old")" = "$(readlink -f "$CURRENT")" ] && continue
  [ "$(readlink -f "$old")" = "$previous" ] && continue
  [ -f "$old/.deploy-failed" ] && continue
  log "  removing $(basename "$old")"
  rm -rf "$old"
done

log "deployed $short OK"
