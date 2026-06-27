#!/usr/bin/env bash
set -euo pipefail

env_file="/srv/apfel-park/mail/.env"

sed -i 's/^SSL_TYPE=.*/SSL_TYPE=manual/' "$env_file"
sed -i 's#^SSL_CERT_PATH=.*#SSL_CERT_PATH=/etc/letsencrypt/live/apfel-park.de/fullchain.pem#' "$env_file"
sed -i 's#^SSL_KEY_PATH=.*#SSL_KEY_PATH=/etc/letsencrypt/live/apfel-park.de/privkey.pem#' "$env_file"
grep -q '^SSL_CERT_PATH=' "$env_file" || echo 'SSL_CERT_PATH=/etc/letsencrypt/live/apfel-park.de/fullchain.pem' >> "$env_file"
grep -q '^SSL_KEY_PATH=' "$env_file" || echo 'SSL_KEY_PATH=/etc/letsencrypt/live/apfel-park.de/privkey.pem' >> "$env_file"

docker compose -f /srv/apfel-park/mail/compose.yaml up -d
