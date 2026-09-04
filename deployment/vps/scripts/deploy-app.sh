#!/usr/bin/env bash
# Deploy the Apfel Park Next.js app from a committed, pushed git ref.
#
#   deploy-app.sh [ref]     # default: origin/<branch checked out in source clone>
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
BASE_URL=http://127.0.0.1:3000
KEEP=3

export PATH=/root/.nvm/versions/node/v24.14.0/bin:$PATH

log() { printf '[deploy] %s\n' "$*"; }
die() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

[ -f "$ENV_FILE" ]    || die "missing env file: $ENV_FILE"
[ -d "$SOURCE/.git" ] || die "missing source clone at $SOURCE"

log "fetching origin"
git -C "$SOURCE" fetch origin --prune --tags --quiet

branch="$(git -C "$SOURCE" rev-parse --abbrev-ref HEAD)"
ref="${1:-origin/$branch}"
sha="$(git -C "$SOURCE" rev-parse --verify "$ref^{commit}" 2>/dev/null)" \
  || die "ref not found: $ref"
export DEPLOYMENT_VERSION="$sha"

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

log "npm audit --audit-level=high"
npm audit --audit-level=high

log "npm run build"
set -a; . "$ENV_FILE"; set +a
npm run build

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

# /uploads is ~1.2GB of user uploads kept in shared/ (outside releases) and
# served by nginx via alias. next/image resolves local paths against the
# standalone public dir, so without this symlink every
# /_next/image?url=/uploads/... returns 400 "not a valid image" and the
# avif/webp config in next.config.ts is dead weight. Must exist before the
# service starts -- Next resolves public/ at boot.
ln -sfn "$APP_ROOT/shared/uploads" "$release/.next/standalone/public/uploads"

# Nginx serves .next/static directly. Make the release path traversable and
# static build artifacts readable even when the invoking shell had umask 077.
chmod 0755 "$release" "$release/.next"
chmod -R a+rX "$release/.next/static"

previous="$(readlink -e "$CURRENT" 2>/dev/null || true)"
worker_present=0
if systemctl cat "$WORKER_SERVICE" >/dev/null 2>&1; then worker_present=1; fi

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
