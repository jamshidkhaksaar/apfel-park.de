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

APP_ROOT=/srv/apfel-park/app
SOURCE="$APP_ROOT/source"
RELEASES="$APP_ROOT/releases"
CURRENT="$APP_ROOT/current"
ENV_FILE="$APP_ROOT/shared/app.env"
SERVICE=apfel-park-nextjs
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

log "npm run build"
set -a; . "$ENV_FILE"; set +a
npm run build

# Apply additive schema changes before switching the live symlink. A failed
# migration stops the release here; the currently running app remains active.
# Migrations are transactional and recorded in schema_migrations.
log "database migrations"
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

previous="$(readlink -f "$CURRENT" 2>/dev/null || true)"

log "activating"
ln -sfn "$release" "$CURRENT.tmp"
mv -Tf "$CURRENT.tmp" "$CURRENT"
systemctl restart "$SERVICE"
if systemctl cat apfel-park-marketplace-worker.service >/dev/null 2>&1; then
  systemctl restart apfel-park-marketplace-worker.service
fi

log "health check"
ok=0
for _ in $(seq 1 20); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/de" || true)" = "200" ] && { ok=1; break; }
  sleep 2
done

if [ "$ok" -ne 1 ]; then
  [ -n "$previous" ] && [ -d "$previous" ] || die "health check failed; no previous release to roll back to"
  log "health check FAILED -- rolling back to $(basename "$previous")"
  ln -sfn "$previous" "$CURRENT.tmp"
  mv -Tf "$CURRENT.tmp" "$CURRENT"
  systemctl restart "$SERVICE"
  die "rolled back; $release kept for inspection"
fi

# Unknown locales must 404. They returned 500 until cb99627f; this catches a
# regression before it reaches the crawlers.
code="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/xx" || true)"
[ "$code" = "404" ] || log "WARNING: /xx returned $code, expected 404"

# / must redirect to /de PERMANENTLY (308). A 307 tells Google to keep the bare
# domain indexed instead of consolidating onto /de, which split the homepage
# across four indexed URLs and left the legacy http://www variant outranking
# the canonical one.
code="$(curl -s -o /dev/null -w '%{http_code}' --max-redirs 0 "$BASE_URL/" || true)"
[ "$code" = "308" ] || log "WARNING: / returned $code, expected 308 (permanent redirect to /de)"

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
  log "  removing $(basename "$old")"
  rm -rf "$old"
done

log "deployed $short OK"
