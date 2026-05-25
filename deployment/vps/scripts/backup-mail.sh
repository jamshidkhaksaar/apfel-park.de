#!/usr/bin/env bash
set -euo pipefail
umask 077

backup_dir="/srv/apfel-park/backups/mail"
mkdir -p "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

tar -C /srv/apfel-park/mail/docker-data -czf "$backup_dir/mail-$stamp.tar.gz" .
find "$backup_dir" -type f -name 'mail-*.tar.gz' -mtime +14 -delete
