# Apfel Park Product Intake v2

Shadow-first product add/update pipeline for Hermes, Safi's restricted Telegram bot, n8n and the Apfel Park application.

## Safety state

- Application decisions are shadow-only: no product or inventory mutation.
- The inactive-draft, ledger and final-publication code paths exist but require both `PRODUCT_INTAKE_DEFAULT_MODE=live` and `PRODUCT_INTAKE_LIVE_ENABLED=true`; the deploy script deliberately sets neither.
- Imported n8n v2 workflows are inactive by default.
- Safi bot v2 is built but not started, avoiding a Telegram polling conflict with v1.
- The current v1 workflow and bot remain available for rollback.

## Deploy

Deploy the matching application commit first so its migration and API routes exist. Then, as root:

```bash
bash /srv/apfel-park/app/current/deployment/vps/product-intake/deploy-shadow.sh
```

The script:

1. Creates a consistent SQLite backup and copies current workflow/bot/Hermes state.
2. Rotates the exposed legacy draft token once and removes it from inline Compose configuration.
3. Creates persistent HMAC, preview, asset and vision secrets without printing them.
4. Installs the localhost barcode/OCR/redaction service and cleanup timer.
5. Imports APF-01..07/99 workflows inactive.
6. Builds the restricted Safi bot without starting it.
7. Installs the Hermes v2 skill and client.

## Validation

```bash
curl -fsS http://127.0.0.1:8730/health
curl -fsS http://127.0.0.1:5678/healthz
systemctl is-active apfel-intake-vision apfel-intake-cleanup.timer
docker exec n8n n8n export:workflow --all --output=/tmp/workflows.json
node /srv/apfel-intake/current/n8n/test_generated_workflows.cjs
python3 -m unittest discover -s /srv/apfel-intake/current/hermes -p 'test_*.py'
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /srv/apfel-intake/current/verify-migration.sql
```

Run fixture extraction before activating any webhook. Confirm raw About/barcode images never appear in n8n execution data and only redacted assets receive signed vision URLs.

## Pilot activation

Activation is intentionally separate from deployment. Enable APF-01..07 and APF-99 only after fixture validation. Keep all application runs in `mode=shadow`. Start Safi bot v2 only after stopping v1 to avoid two pollers using the same Telegram token.

Do not enable live product application until ten successful shadow sessions over seven days and explicit owner approval.
