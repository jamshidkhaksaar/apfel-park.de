#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "run as root" >&2
  exit 1
fi

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="/srv/backups/apfel-intake-v2/$STAMP"
RELEASE_DIR="/srv/apfel-intake/releases/$STAMP"
STATE_DIR="/srv/apfel-intake/state"
APP_ENV=/srv/apfel-park/app/shared/app.env
N8N_ENV=/srv/n8n/.env
N8N_COMPOSE=/srv/n8n/docker-compose.yml
HERMES_ENV=/root/.hermes/.env
HERMES_CONFIG=/root/.hermes/config.yaml
OLD_BOT_ENV=/srv/bot-factory/bots/apfel-park-intake/.env

env_value() { [[ -f "$1" ]] && sed -n "s/^$2=//p" "$1" | tail -1 || true; }
random_secret() { openssl rand -hex 32; }
existing_or_random() { local value; value="$(env_value "$1" "$2")"; [[ ${#value} -ge 32 ]] && printf '%s' "$value" || random_secret; }
require_file() { [[ -r "$1" ]] || { echo "missing required file: $1" >&2; exit 1; }; }

update_env() {
  local file="$1"; shift
  python3 - "$file" "$@" <<'PY'
import os,sys,tempfile
path=sys.argv[1]; pairs=dict(arg.split("=",1) for arg in sys.argv[2:])
lines=open(path,encoding="utf-8").read().splitlines() if os.path.exists(path) else []
seen=set(); out=[]
for line in lines:
    key=line.split("=",1)[0] if "=" in line and not line.lstrip().startswith("#") else None
    if key in pairs:
        out.append(f"{key}={pairs[key]}"); seen.add(key)
    else: out.append(line)
for key,value in pairs.items():
    if key not in seen: out.append(f"{key}={value}")
directory=os.path.dirname(path) or "."; os.makedirs(directory,exist_ok=True)
fd,tmp=tempfile.mkstemp(dir=directory,prefix=".env.",text=True)
with os.fdopen(fd,"w",encoding="utf-8") as handle: handle.write("\n".join(out)+"\n")
os.chmod(tmp,0o600); os.replace(tmp,path)
PY
}

for required in "$APP_ENV" "$N8N_ENV" "$N8N_COMPOSE" "$HERMES_ENV" "$HERMES_CONFIG" "$OLD_BOT_ENV" \
  "$SOURCE_DIR/verify-migration.sql" "$SOURCE_DIR/n8n/build_workflows.py" "$SOURCE_DIR/n8n/test_generated_workflows.cjs"; do
  require_file "$required"
done

BOT_TOKEN="$(env_value "$OLD_BOT_ENV" BOT_TOKEN)"
OWNER_CHAT_ID="$(env_value "$OLD_BOT_ENV" OWNER_CHAT_ID)"
ALLOWED_USER_IDS="$(env_value "$OLD_BOT_ENV" ALLOWED_USER_IDS)"
[[ -n "$BOT_TOKEN" && -n "$OWNER_CHAT_ID" ]] || { echo "existing Safi bot credentials are missing" >&2; exit 1; }

OWNER_EMAILS="$(env_value "$APP_ENV" PRODUCT_INTAKE_OWNER_EMAILS)"
if [[ -z "$OWNER_EMAILS" ]]; then
  ADMIN_EMAILS="$(env_value "$APP_ENV" ADMIN_EMAILS)"
  if [[ -z "$ADMIN_EMAILS" || "$ADMIN_EMAILS" == *,* ]]; then
    echo "set exactly one PRODUCT_INTAKE_OWNER_EMAILS value for Jamshid" >&2
    exit 1
  fi
  OWNER_EMAILS="$ADMIN_EMAILS"
fi
DATABASE_URL="$(env_value "$APP_ENV" DATABASE_URL)"
[[ -n "$DATABASE_URL" ]] || { echo "DATABASE_URL is missing from the application environment" >&2; exit 1; }

python3 "$SOURCE_DIR/n8n/build_workflows.py" >/dev/null
node "$SOURCE_DIR/n8n/test_generated_workflows.cjs" >/dev/null
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SOURCE_DIR/verify-migration.sql" >/dev/null

docker inspect n8n >/dev/null 2>&1 || { echo "n8n container is not available" >&2; exit 1; }
install -d -m 0700 "$BACKUP_DIR" "$STATE_DIR"
install -d -m 0755 "$RELEASE_DIR"

python3 - "$BACKUP_DIR/database.sqlite" <<'PY'
import sqlite3,sys
source=sqlite3.connect("file:/srv/n8n/data/database.sqlite?mode=ro", uri=True)
target=sqlite3.connect(sys.argv[1]); source.backup(target)
target.close(); source.close()
PY
docker exec n8n n8n export:workflow --all --output=/tmp/workflows-pre-v2.json >/dev/null
docker cp n8n:/tmp/workflows-pre-v2.json "$BACKUP_DIR/workflows-pre-v2.json" >/dev/null
cp -a "$APP_ENV" "$BACKUP_DIR/app.env"
cp -a "$N8N_ENV" "$BACKUP_DIR/n8n.env"
cp -a "$N8N_COMPOSE" "$BACKUP_DIR/n8n-compose.yml"
cp -a "$HERMES_ENV" "$BACKUP_DIR/hermes.env"
cp -a "$HERMES_CONFIG" "$BACKUP_DIR/hermes-config.yaml"
[[ -d /root/.hermes/skills/apfel-park ]] && cp -a /root/.hermes/skills/apfel-park "$BACKUP_DIR/hermes-apfel-skills"
[[ -d /srv/bot-factory/bots/apfel-park-intake ]] && cp -a /srv/bot-factory/bots/apfel-park-intake "$BACKUP_DIR/safi-bot-v1"

PREVIOUS_RELEASE="$(readlink -f /srv/apfel-intake/current 2>/dev/null || true)"
cp -a "$SOURCE_DIR"/. "$RELEASE_DIR"/
ln -sfn "$RELEASE_DIR" /srv/apfel-intake/current

rollback() {
  local code=$?
  trap - ERR
  cp -a "$BACKUP_DIR/app.env" "$APP_ENV" || true
  cp -a "$BACKUP_DIR/n8n.env" "$N8N_ENV" || true
  cp -a "$BACKUP_DIR/n8n-compose.yml" "$N8N_COMPOSE" || true
  cp -a "$BACKUP_DIR/hermes.env" "$HERMES_ENV" || true
  cp -a "$BACKUP_DIR/hermes-config.yaml" "$HERMES_CONFIG" || true
  if [[ -n "$PREVIOUS_RELEASE" && -d "$PREVIOUS_RELEASE" ]]; then ln -sfn "$PREVIOUS_RELEASE" /srv/apfel-intake/current; fi
  docker compose -f "$N8N_COMPOSE" --env-file "$N8N_ENV" up -d n8n >/dev/null 2>&1 || true
  systemctl restart apfel-park-nextjs hermes-gateway >/dev/null 2>&1 || true
  echo "shadow deployment failed; configuration restored. Backup: $BACKUP_DIR" >&2
  exit "$code"
}
trap rollback ERR

APP_SUBMIT_SECRET="$(existing_or_random "$N8N_ENV" PRODUCT_INTAKE_SUBMIT_SECRET)"
APP_OWNER_SECRET="$(existing_or_random "$N8N_ENV" PRODUCT_INTAKE_OWNER_SECRET)"
HMAC_KEYS_B64="$(printf '%s' "{\"n8n-submit-v2\":\"$APP_SUBMIT_SECRET\",\"n8n-owner-v2\":\"$APP_OWNER_SECRET\"}" | base64 -w0)"
PREVIEW_SECRET="$(existing_or_random "$APP_ENV" PRODUCT_INTAKE_PREVIEW_SECRET)"
ASSET_SECRET="$(existing_or_random "$APP_ENV" PRODUCT_INTAKE_ASSET_SECRET)"
N8N_SUBMIT_SECRET="$(existing_or_random "$N8N_ENV" N8N_INTAKE_HMAC_SECRET)"
N8N_OWNER_SECRET="$(existing_or_random "$N8N_ENV" N8N_OWNER_HMAC_SECRET)"
NODE_BUILTINS="$(env_value "$N8N_ENV" NODE_FUNCTION_ALLOW_BUILTIN)"
[[ ",$NODE_BUILTINS," == *,crypto,* ]] || NODE_BUILTINS="${NODE_BUILTINS:+$NODE_BUILTINS,}crypto"
ALLOWED_SOURCE_DOMAINS="$(env_value "$APP_ENV" PRODUCT_INTAKE_ALLOWED_SOURCE_DOMAINS)"
ROTATE_DRAFT_TOKEN=false
if [[ ! -f "$STATE_DIR/draft-token-rotated" ]]; then
  DRAFT_TOKEN="$(random_secret)"
  update_env "$APP_ENV" "PRODUCT_DRAFT_API_TOKEN=$DRAFT_TOKEN"
  update_env "$N8N_ENV" "PRODUCT_DRAFT_API_TOKEN=$DRAFT_TOKEN"
  ROTATE_DRAFT_TOKEN=true
fi

update_env "$APP_ENV" \
  "PRODUCT_INTAKE_HMAC_KEYS_B64=$HMAC_KEYS_B64" \
  "PRODUCT_INTAKE_OWNER_KEY_IDS=n8n-owner-v2" "PRODUCT_INTAKE_OWNER_EMAILS=$OWNER_EMAILS" \
  "PRODUCT_INTAKE_PROXY_KEY_IDS=n8n-submit-v2" "PRODUCT_INTAKE_SAFI_KEY_IDS=" \
  "PRODUCT_INTAKE_ALLOWED_SOURCE_DOMAINS=$ALLOWED_SOURCE_DOMAINS" \
  "PRODUCT_INTAKE_PREVIEW_SECRET=$PREVIEW_SECRET" "PRODUCT_INTAKE_ASSET_SECRET=$ASSET_SECRET" \
  "PRODUCT_INTAKE_LIVE_ENABLED=false" "PRODUCT_INTAKE_DEFAULT_MODE=shadow"

update_env "$N8N_ENV" \
  "PRODUCT_INTAKE_SUBMIT_KEY_ID=n8n-submit-v2" "PRODUCT_INTAKE_SUBMIT_SECRET=$APP_SUBMIT_SECRET" \
  "PRODUCT_INTAKE_OWNER_KEY_ID=n8n-owner-v2" "PRODUCT_INTAKE_OWNER_SECRET=$APP_OWNER_SECRET" \
  "N8N_INTAKE_HMAC_SECRET=$N8N_SUBMIT_SECRET" \
  "N8N_OWNER_HMAC_SECRET=$N8N_OWNER_SECRET" "N8N_OWNER_KEY_ID=owner" "N8N_SAFI_KEY_ID=safi-bot" \
  "NODE_FUNCTION_ALLOW_BUILTIN=$NODE_BUILTINS" \
  "PRODUCT_INTAKE_ALLOWED_SOURCE_DOMAINS=$ALLOWED_SOURCE_DOMAINS" "APFEL_STORE_URL=https://apfel-park.de"

update_env "$HERMES_ENV" \
  "N8N_OWNER_HMAC_SECRET=$N8N_OWNER_SECRET" "N8N_OWNER_KEY_ID=owner" \
  "PRODUCT_INTAKE_OWNER_ACTOR_ID=$OWNER_EMAILS" \
  "N8N_PRODUCT_INTAKE_BASE=http://127.0.0.1:5678/webhook"

python3 - "$N8N_COMPOSE" <<'PY'
import re,sys
p=sys.argv[1]; text=open(p,encoding="utf-8").read()
anchor="      - DRAFT_API_URL=https://apfel-park.de/api/integrations/products/draft"
if anchor not in text: raise SystemExit("n8n Compose insertion anchor is missing")
text=re.sub(r"(?m)^\s*- PRODUCT_DRAFT_API_TOKEN=.*$", "      - PRODUCT_DRAFT_API_TOKEN=${PRODUCT_DRAFT_API_TOKEN}", text)
required=[
"PRODUCT_INTAKE_SUBMIT_KEY_ID","PRODUCT_INTAKE_SUBMIT_SECRET","PRODUCT_INTAKE_OWNER_KEY_ID","PRODUCT_INTAKE_OWNER_SECRET",
"N8N_INTAKE_HMAC_SECRET","N8N_OWNER_HMAC_SECRET","N8N_OWNER_KEY_ID","N8N_SAFI_KEY_ID",
"NODE_FUNCTION_ALLOW_BUILTIN","PRODUCT_INTAKE_ALLOWED_SOURCE_DOMAINS","APFEL_STORE_URL",
]
for key in required:
    line=f"      - {key}=${{{key}}}"
    if line not in text: text=text.replace(anchor,anchor+"\n"+line)
open(p,"w",encoding="utf-8").write(text)
PY

bash "$RELEASE_DIR/install-vision.sh"
VISION_TOKEN="$(env_value /etc/apfel-intake-vision.env APFEL_INTAKE_VISION_TOKEN)"
[[ "$VISION_TOKEN" =~ ^[a-f0-9]{64}$ ]] || { echo "vision token is invalid" >&2; false; }
update_env "$HERMES_ENV" "APFEL_INTAKE_VISION_TOKEN=$VISION_TOKEN"

install -d -m 0755 /srv/n8n/workflows/v2
cp -a "$RELEASE_DIR/n8n/generated"/*.json /srv/n8n/workflows/v2/
docker compose -f "$N8N_COMPOSE" --env-file "$N8N_ENV" up -d n8n
N8N_HEALTHY=false
for _ in {1..30}; do
  if curl -fsS http://127.0.0.1:5678/healthz >/dev/null; then N8N_HEALTHY=true; break; fi
  sleep 2
done
[[ "$N8N_HEALTHY" == true ]] || { echo "n8n did not become healthy" >&2; false; }

APF99_IMPORTED=false
for workflow in /srv/n8n/workflows/v2/APF99ERRORV2.json /srv/n8n/workflows/v2/*.json; do
  name="$(basename "$workflow")"
  if [[ "$name" == "APF99ERRORV2.json" && "$APF99_IMPORTED" == true ]]; then continue; fi
  docker cp "$workflow" "n8n:/tmp/$name"
  docker exec n8n n8n import:workflow --input="/tmp/$name" >/dev/null
  [[ "$name" == "APF99ERRORV2.json" ]] && APF99_IMPORTED=true || true
done

BOT_DIR=/srv/bot-factory/bots/apfel-park-intake-v2
install -d -m 0755 "$BOT_DIR"
cp -a "$RELEASE_DIR/safi-bot"/. "$BOT_DIR"/
update_env "$BOT_DIR/.env" \
  "BOT_TOKEN=$BOT_TOKEN" "OWNER_CHAT_ID=$OWNER_CHAT_ID" "ALLOWED_USER_IDS=${ALLOWED_USER_IDS:-$OWNER_CHAT_ID}" \
  "N8N_INTAKE_URL=http://127.0.0.1:5678/webhook/apfel-intake-v2" \
  "N8N_INTAKE_KEY_ID=safi-bot" "N8N_INTAKE_HMAC_SECRET=$N8N_SUBMIT_SECRET" \
  "VISION_URL=http://127.0.0.1:8730" "VISION_TOKEN=$VISION_TOKEN"
docker compose -f "$BOT_DIR/docker-compose.yml" build bot >/dev/null

HERMES_SKILL=/root/.hermes/skills/apfel-park/apfel-product-intake-v2
install -d -m 0700 "$HERMES_SKILL"
install -m 0600 "$RELEASE_DIR/hermes/SKILL.md" "$HERMES_SKILL/SKILL.md"
install -m 0700 "$RELEASE_DIR/hermes/intake_client.py" "$HERMES_SKILL/intake_client.py"
install -m 0700 "$RELEASE_DIR/hermes/configure_vision.py" "$HERMES_SKILL/configure_vision.py"
install -m 0700 "$RELEASE_DIR/hermes/vision_self_test.py" "$HERMES_SKILL/vision_self_test.py"
/usr/local/lib/hermes-agent/venv/bin/python "$HERMES_SKILL/configure_vision.py"

systemctl restart apfel-park-nextjs hermes-gateway
/usr/local/lib/hermes-agent/venv/bin/python "$HERMES_SKILL/vision_self_test.py"
curl -fsS http://127.0.0.1:3000/de >/dev/null
[[ "$ROTATE_DRAFT_TOKEN" == true ]] && touch "$STATE_DIR/draft-token-rotated" || true

trap - ERR
echo "Shadow stack deployed. n8n v2 workflows imported inactive; Safi v2 image built but not started."
echo "Backup: $BACKUP_DIR"
