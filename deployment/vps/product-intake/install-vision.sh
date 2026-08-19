#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")/vision" && pwd)"
TARGET_DIR=/usr/local/lib/apfel-intake-vision
ENV_FILE=/etc/apfel-intake-vision.env

apt-get update -qq
apt-get install -y --no-install-recommends python3-venv tesseract-ocr tesseract-ocr-eng tesseract-ocr-deu libgl1 >/dev/null

install -d -m 0755 "$TARGET_DIR" /srv/n8n/media/intake
install -d -m 0700 /srv/apfel-intake/private/sensitive /srv/apfel-intake/private/ordinary /srv/apfel-intake/submissions
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 ! -name venv -exec rm -rf -- {} +
cp -a "$SOURCE_DIR"/. "$TARGET_DIR"/

if [[ ! -f "$ENV_FILE" ]]; then
  umask 077
  token="$(openssl rand -hex 32)"
  {
    echo "APFEL_INTAKE_VISION_TOKEN=$token"
    echo "APFEL_INTAKE_SENSITIVE_ROOT=/srv/apfel-intake/private/sensitive"
    echo "APFEL_INTAKE_ORDINARY_ROOT=/srv/apfel-intake/private/ordinary"
    echo "APFEL_INTAKE_REDACTED_ROOT=/srv/n8n/media/intake"
  } > "$ENV_FILE"
fi
chmod 0600 "$ENV_FILE"
token="$(sed -n 's/^APFEL_INTAKE_VISION_TOKEN=//p' "$ENV_FILE" | tail -1)"
if [[ ! "$token" =~ ^[a-f0-9]{64}$ ]]; then
  echo "invalid APFEL_INTAKE_VISION_TOKEN in $ENV_FILE" >&2
  exit 1
fi

python3 -m venv "$TARGET_DIR/venv"
"$TARGET_DIR/venv/bin/pip" install --disable-pip-version-check --no-cache-dir -r "$TARGET_DIR/requirements.txt" >/dev/null

install -m 0644 "$(dirname "$0")/systemd/apfel-intake-vision.service" /etc/systemd/system/
install -m 0644 "$(dirname "$0")/systemd/apfel-intake-cleanup.service" /etc/systemd/system/
install -m 0644 "$(dirname "$0")/systemd/apfel-intake-cleanup.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable apfel-intake-vision.service apfel-intake-cleanup.timer >/dev/null
systemctl restart apfel-intake-vision.service
systemctl start apfel-intake-cleanup.timer
healthy=false
for _ in {1..30}; do
  if curl --fail --silent http://127.0.0.1:8730/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done
[[ "$healthy" == true ]] || { echo "apfel-intake-vision did not become healthy" >&2; exit 1; }
echo "apfel-intake-vision installed and healthy"
