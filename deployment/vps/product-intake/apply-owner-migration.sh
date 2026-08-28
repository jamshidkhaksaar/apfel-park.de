#!/usr/bin/env bash
# Apply product-intake migrations that must extend postgres-owned catalog tables.
# All other migrations continue to run as the app role.

set -Eeuo pipefail

OWNER_MIGRATIONS=(
  20260819_product_intake_core.sql
  20260820_product_intake_workspace.sql
  20260827_professional_product_platform.sql
  20260827_campaign_redemption_history.sql
  20260828_provider_reference_uniqueness.sql
)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RELEASE_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BACKUP_ROOT=/srv/backups/apfel-park-db

die() { printf '[owner-migration] ERROR: %s\n' "$*" >&2; exit 1; }
log() { printf '[owner-migration] %s\n' "$*"; }

[[ ${EUID:-$(id -u)} -eq 0 ]] || die "run as root"
[[ -n ${DATABASE_URL:-} ]] || die "DATABASE_URL is not exported"
command -v node >/dev/null 2>&1 || die "node is unavailable"
command -v psql >/dev/null 2>&1 || die "psql is unavailable"
command -v pg_dump >/dev/null 2>&1 || die "pg_dump is unavailable"
command -v sudo >/dev/null 2>&1 || die "sudo is unavailable"

mapfile -t DB_META < <(node <<'NODE'
const url = new URL(process.env.DATABASE_URL);
const host = url.hostname.toLowerCase();
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  throw new Error("owner migration is restricted to the local PostgreSQL server");
}
const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
const role = decodeURIComponent(url.username);
const safeIdentifier = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;
if (!safeIdentifier.test(database) || !safeIdentifier.test(role)) {
  throw new Error("database name or application role is not a conventional PostgreSQL identifier");
}
process.stdout.write(`${database}\n${role}\n`);
NODE
) || die "could not validate DATABASE_URL"

[[ ${#DB_META[@]} -eq 2 ]] || die "could not parse database metadata"
DB_NAME="${DB_META[0]}"
APP_ROLE="${DB_META[1]}"
[[ "$APP_ROLE" != postgres ]] || die "application DATABASE_URL must not use the postgres superuser"

install -d -m 0700 "$BACKUP_ROOT"
backup_taken=0

for EXPECTED_FILENAME in "${OWNER_MIGRATIONS[@]}"; do
  MIGRATION_FILE="$RELEASE_ROOT/supabase/migrations/$EXPECTED_FILENAME"
  [[ -r "$MIGRATION_FILE" ]] || die "missing migration: $MIGRATION_FILE"
  CHECKSUM="$(sha256sum "$MIGRATION_FILE" | cut -c1-16)"
  [[ "$CHECKSUM" =~ ^[a-f0-9]{16}$ ]] || die "could not calculate migration checksum"
  APPLIED_CHECKSUM="$(psql "$DATABASE_URL" -AtXq -v ON_ERROR_STOP=1 \
    -c "select checksum from public.schema_migrations where filename='$EXPECTED_FILENAME'")"
  if [[ -n "$APPLIED_CHECKSUM" ]]; then
    [[ "$APPLIED_CHECKSUM" == "$CHECKSUM" ]] \
      || die "recorded checksum differs for $EXPECTED_FILENAME"
    log "$EXPECTED_FILENAME is already applied"
    continue
  fi
  if [[ "$backup_taken" -eq 0 ]]; then
    STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
    BACKUP_FILE="$BACKUP_ROOT/pre-product-intake-$STAMP.dump"
    umask 077
    log "creating pre-migration backup"
    sudo -u postgres pg_dump --format=custom --dbname="$DB_NAME" > "$BACKUP_FILE"
    [[ -s "$BACKUP_FILE" ]] || die "database backup is empty"
    backup_taken=1
  fi
  log "applying $EXPECTED_FILENAME as the local database owner"
  sudo -u postgres env PGOPTIONS="-c apfel.runtime_role=$APP_ROLE" \
    psql --no-psqlrc --dbname="$DB_NAME" --set=ON_ERROR_STOP=1 --single-transaction \
    --file="$MIGRATION_FILE" \
    --command="insert into public.schema_migrations (filename, checksum) values ('$EXPECTED_FILENAME', '$CHECKSUM')"
  VERIFY="$(psql "$DATABASE_URL" -AtXq -v ON_ERROR_STOP=1 -c "select checksum from public.schema_migrations where filename='$EXPECTED_FILENAME'")"
  [[ "$VERIFY" == "$CHECKSUM" ]] || die "post-migration verification failed for $EXPECTED_FILENAME"
  log "applied $EXPECTED_FILENAME"
done
