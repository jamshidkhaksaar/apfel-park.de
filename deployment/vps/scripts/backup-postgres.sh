#!/usr/bin/env bash
set -euo pipefail
umask 077

backup_dir="/srv/apfel-park/backups/postgres"
mkdir -p "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

sudo -u postgres pg_dumpall | gzip -9 > "$backup_dir/postgres-$stamp.sql.gz"
find "$backup_dir" -type f -name 'postgres-*.sql.gz' -mtime +14 -delete
