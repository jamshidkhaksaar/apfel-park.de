#!/usr/bin/env bash
# Apfel Park release deploy.
#
# Builds from this working tree, publishes a timestamped release, switches the
# `current` symlink and restarts both services. Encodes three things that are
# easy to get wrong by hand:
#   1. `next build` wipes .next/standalone/.next/static and public/uploads --
#      both must be recreated after every build or the site loads unstyled and
#      every product image 404s.
#   2. apfel-park-marketplace-worker resolves `current` once at startup, so a
#      symlink swap alone leaves it running the old release indefinitely.
#   3. The release is smoke-tested on a spare port before anything goes live.
set -euo pipefail

APP=/srv/apfel-park/app
SRC="$APP/source"
SHARED="$APP/shared"
# A fixed port collides with anything left over from an interrupted deploy, so
# ask the kernel for a free one instead.
PORT_TEST="$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close();});')"
LABEL="${1:-release}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REL="$APP/releases/${STAMP}-${LABEL}"
MIN_FREE_KB=$((8 * 1024 * 1024))
RELEASE_RETENTION=2

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

mapfile -t DISK_ROWS < <(df -Pk "$APP")
read -r _ _ _ available_kb _ <<< "${DISK_ROWS[1]:-}"
if [[ ! "$available_kb" =~ ^[0-9]+$ ]] || (( available_kb < MIN_FREE_KB )); then
  echo "FATAL: less than 8 GiB free under $APP; refusing to build another release"
  exit 1
fi

say "Building $LABEL"
cd "$SRC"
set -a; . "$SHARED/app.env"; set +a
npm run build

say "Restoring standalone assets the build removes"
cp -r "$SRC/.next/static" "$SRC/.next/standalone/.next/"
ln -sfn "$SHARED/uploads" "$SRC/.next/standalone/public/uploads"

say "Publishing $REL"
mkdir -p "$REL"
rsync -a --exclude '.git' --exclude '.next/cache' "$SRC/" "$REL/"
[ -f "$REL/.next/standalone/server.js" ] || { echo "FATAL: server.js missing"; exit 1; }
[ -d "$REL/.next/standalone/.next/static" ] || { echo "FATAL: static missing"; exit 1; }
[ -e "$REL/.next/standalone/public/uploads/." ] || { echo "FATAL: uploads symlink broken"; exit 1; }

say "Applying database migrations"
cd "$REL"
if [ -x "$REL/deployment/vps/product-intake/apply-owner-migration.sh" ]; then
  bash "$REL/deployment/vps/product-intake/apply-owner-migration.sh"
fi
npm run db:migrate
npm run db:status

say "Smoke-testing on :$PORT_TEST before going live"
# A leaked smoke server is not harmless: one survived a previous deploy and sat
# on the box for hours holding a whole Next.js heap. Clear the port first, and
# stop by port afterwards rather than trusting a recorded PID.
stop_smoke() {
  local pid
  pid="$(ss -lptn "sport = :$PORT_TEST" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | head -1 || true)"
  [ -n "$pid" ] || return 0
  kill "$pid" 2>/dev/null || true
  for _ in 1 2 3 4 5; do
    sleep 1
    kill -0 "$pid" 2>/dev/null || return 0
  done
  kill -9 "$pid" 2>/dev/null || true
}
stop_smoke
# A killed deploy can orphan its smoke server; wait for the port to actually
# free before binding, or the next run dies with EADDRINUSE mid-deploy.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  ss -lptn "sport = :$PORT_TEST" 2>/dev/null | grep -q LISTEN || break
  sleep 1
  stop_smoke
done
if ss -lptn "sport = :$PORT_TEST" 2>/dev/null | grep -q LISTEN; then
  echo "FATAL: :$PORT_TEST still in use; refusing to deploy without a smoke test"
  exit 1
fi
( cd "$REL/.next/standalone" && PORT=$PORT_TEST HOSTNAME=127.0.0.1 node server.js >/tmp/apfel-deploy-smoke.log 2>&1 & )
trap stop_smoke EXIT
ready=0
for _ in $(seq 1 60); do
  sleep 1
  if curl -sf --connect-timeout 2 --max-time 5 -o /dev/null "http://127.0.0.1:$PORT_TEST/de/store"; then ready=1; break; fi
done
if [ "$ready" != "1" ]; then
  echo "FATAL: smoke server never became ready on :$PORT_TEST"
  echo "--- smoke server log ---"
  tail -30 /tmp/apfel-deploy-smoke.log 2>/dev/null || echo "(no log written -- server never started)"
  exit 1
fi
for path in /de /de/store /de/checkout; do
  code=$(curl -s --connect-timeout 2 --max-time 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT_TEST$path" || true)
  [ "$code" = "200" ] || { echo "FATAL: $path returned $code"; exit 1; }
  echo "  $path $code"
done
stop_smoke
trap - EXIT

say "Switching live"
PREV="$(readlink -f "$APP/current" || true)"
rollback_live() {
  if [[ -n "$PREV" && -d "$PREV" ]]; then
    echo "  rolling back to $PREV"
    ln -sfn "$PREV" "$APP/current"
    systemctl restart apfel-park-nextjs apfel-park-marketplace-worker || true
  fi
}
ln -sfn "$REL" "$APP/current"
if ! systemctl restart apfel-park-nextjs; then
  echo "FATAL: apfel-park-nextjs restart failed"
  rollback_live
  exit 1
fi
# Must restart too: it pins whichever release it resolved at startup.
if ! systemctl restart apfel-park-marketplace-worker; then
  echo "FATAL: marketplace worker restart failed"
  rollback_live
  exit 1
fi
sleep 6

say "Verifying"
for unit in apfel-park-nextjs apfel-park-marketplace-worker; do
  state=$(systemctl is-active "$unit" || true)
  echo "  $unit: $state"
  if [ "$state" != "active" ]; then
    echo "FATAL: $unit is not active"
    rollback_live
    exit 1
  fi
done
for path in /de /de/store; do
  code=$(curl -s --connect-timeout 5 --max-time 15 --retry 2 --retry-delay 1 -o /dev/null -w '%{http_code}' "https://apfel-park.de$path" || true)
  echo "  https://apfel-park.de$path $code"
  if [ "$code" != "200" ]; then
    echo "FATAL: live $path returned $code"
    rollback_live
    exit 1
  fi
done

say "Pruning superseded releases"
mapfile -t RELEASES < <(printf '%s\n' "$APP"/releases/* | sort -r)
additional_kept=0
for candidate in "${RELEASES[@]}"; do
  [[ -d "$candidate" ]] || continue
  resolved="$(readlink -f "$candidate")"
  if [[ "$resolved" == "$REL" || "$resolved" == "$PREV" ]]; then
    continue
  fi
  if (( additional_kept < RELEASE_RETENTION - 2 )); then
    additional_kept=$((additional_kept + 1))
    continue
  fi
  [[ "$resolved" == "$APP"/releases/* ]] || { echo "FATAL: unsafe release path $resolved"; exit 1; }
  rm -rf -- "$resolved"
  echo "  removed $resolved"
done

say "Deployed $REL"
echo "Roll back with:"
echo "  ln -sfn $PREV $APP/current && systemctl restart apfel-park-nextjs apfel-park-marketplace-worker"
