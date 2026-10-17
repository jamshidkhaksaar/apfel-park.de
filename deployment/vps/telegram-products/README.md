# Telegram product entry rollout

This is an opt-in upgrade of the Safi bot. Do not run this bot and an older
poller with the same bot token. Nothing in the application deploy enables it.

## Provisioning after the reviewed deployment is approved

1. Pin and deploy the reviewed commit with the canonical application deploy
   script. The additive `20261016_telegram_product_entry.sql` migration creates
   only new tables/functions; old web releases and workers remain compatible.
   The canonical owner-migration helper applies it because its foreign key to
   the existing owner-owned draft table requires REFERENCES permission.
2. Back up the current bot environment and SQLite state, private submissions,
   application environment, and database. Preserve their permissions. The
   upgraded bot uses a separate `product-callbacks.sqlite`; it never modifies
   `intake.sqlite`. `legacy_bot.py` preserves the original entrypoint. Existing
   unfinished legacy sessions remain in that database for rollback; staff start
   new upgraded drafts rather than importing unverified legacy payloads.
3. Provision these entries in protected `app/shared/app.env`, without printing
   them or adding them to Git:

   - `TELEGRAM_PRODUCTS_ENABLED=true`
   - `TELEGRAM_PRODUCTS_PUBLISH_ENABLED=false`
   - `TELEGRAM_PRODUCT_KEY_ID=telegram-products`
   - `TELEGRAM_PRODUCT_HMAC_SECRET`: new random secret, at least 32 bytes
   - `TELEGRAM_PRODUCT_BOT_USERNAME`: existing Safi username, without `@`
   - `TELEGRAM_PRODUCT_PRIVATE_DIR=/srv/apfel-intake/private/telegram`
   - `AI_ADMIN_CREDENTIALS_ENABLED=true`
   - `AI_CREDENTIAL_ENCRYPTION_KEY`: 32 random bytes encoded as 64 hex digits
   - `SMARTPHONE_EDITOR_ENABLED=true`
   - existing `GEMINI_API_KEY` and `GEMINI_RESEARCH_MODEL` remain valid fallbacks
     until a saved credential is explicitly activated

   Keep the encryption key in encrypted infrastructure backups; a database
   backup alone cannot decrypt saved provider credentials. Key rotation requires
   re-encryption or re-entry of the saved credentials, not just replacing the
   encryption environment variable.
4. Create the private directory with mode 0750. Install the supplied worker unit
   in `/etc/systemd/system`, reload systemd, enable/start it after the new app
   and local vision service are healthy. Restart the web service once to load
   the new protected environment, then verify the settings pages and signed
   integration routes before starting the bot. It processes one job at a time, with
   four-minute leases and at most three interrupted attempts. Quota/provider
   failures remain visible and require explicit retry. Gemini keys stay in the
   application, never in bot configuration.
5. Provide the bot's protected environment with `BOT_TOKEN`,
   `TELEGRAM_PRODUCT_KEY_ID`, the matching `TELEGRAM_PRODUCT_HMAC_SECRET`,
   and `APFEL_API_URL=http://127.0.0.1:3000`. The existing host-network Compose
   service supports that loopback address. Keep `/data` persistent and owned by
   UID/GID 10001 (the container's unprivileged bot account); archive the old
   database before changing ownership. The container has a read-only root
   filesystem, no Linux capabilities, and no host-submission-directory mount. Build the
   image first, stop and verify removal of the old poller, then start the upgrade.
   The bot no longer needs n8n, a vision token, or `ALLOWED_USER_IDS`.
6. Open Settings → Telegram Bot as the intake owner, create a staff invite,
   have the intended account join, verify the numeric account ID in person,
   and approve it. Prior environment allowlists do not grant membership.
7. In Settings → AI Providers, validate/save a primary and optional backup key,
   activate the intended credential, and validate the configured studio model
   with a synthetic image. Test real provider permissions/billing here before
   asking staff to process a batch. Same-project keys share Gemini quotas.

## Acceptance and activation

Run ten shadow sessions over seven stable days, covering all categories, used
and open-box offers, boxed-device incomplete drafts, multiple versions, albums,
quota interruption, key replacement, revocation, and restart recovery. Submit
drafts, inspect originals/edited previews and evidence, but leave publication
disabled. Raw uploads and original device condition remain private evidence.
Retain the existing local vision retention/cleanup policy; see the Telegram
cleanup command below for the new private files.

After explicit owner approval of the real pilot, set only
`TELEGRAM_PRODUCTS_PUBLISH_ENABLED=true` and restart the app/Telegram worker
using the reviewed activation procedure. Do not enable old n8n workflows or
`PRODUCT_INTAKE_LIVE_ENABLED` as part of this feature. Telegram drafts use one
final owner publication through the unified editor; older intake runs keep
their original two-approval state machine.

The store receives only approved images. An actual-device photo and explicit
confirmation are required for every offer, including new/sealed products.
Photo generation may change product details despite the prompt; staff must
compare previews with the private original, reject inaccurate results, and
retain the original when uncertain. No generated image certifies condition.

The worker never infers GTIN, MPN, actual accessories, price, quantity, battery
health, shop testing, or regulatory exceptions. Barcode results are suggestions
requiring manual confirmation. Exact EPREL/regional details remain incomplete
unless verified in the existing admin research/review flow.

## Operations and rollback

- Monitor the worker unit and failed job/error codes; never log request bodies,
  bot download URLs, credentials, or raw photos. Use `/resume` after a bot restart.
- Retrying a photo preserves its safe original. Expired processing leases are
  recovered; cancellation/revocation prevents results from being applied.
- New private files are not covered by the legacy vision cleanup's paths. Run
  `node --import=tsx scripts/telegram-product-cleanup.ts` daily through the
  supplied timer. It retains files referenced by active drafts; terminal
  submissions retain private evidence for 30 days. Public product images are
  never removed by this cleanup.
- On rollback, stop the Telegram worker and upgraded poller before restoring
  the previous application release. Restore the old poller with its original
  environment and `intake.sqlite` only if needed. Keep additive tables and new
  private evidence; do not restore a database over newer shop transactions.
- Canonical application deployment restarts the Telegram worker when installed;
  verify that both it and the bot use the pinned release after activation.

## Verification

```
npm test
npm run lint
npm run typecheck
npm run build
python3 scripts/integration/run-telegram-db.py
python3 -m unittest discover -s deployment/vps/product-intake/safi-bot/tests -v
```

The DB runner refuses pre-existing handles and verifies disposal of its own
database/role. Automated tests use synthetic images and mocked AI/Telegram;
they do not spend provider credits or publish real products.

## Guided intake (October 2026)

Normal `/new` intake asks category/brand/model and condition once, researches the
model, then asks quantity, price, iPhone battery health (or explicit unavailable),
defects and selectable actual accessories. It requests and approves one photo at
a time: six sides for devices, four accessory views or three part views. Photo
approval advances the requested view; box photos never advance device evidence.
The next stop is the complete preview, with an approved-photo album. Adding a
version is explicit, and Edit details uses the seven admin section names.
Research/photo jobs show a typing indicator and update the progress message while
the durable server worker runs. Provider billing/quota failures still need owner
action and have retry/manual completion options. No credentials reach the bot.

Existing offer updates are an explicit `/update` mode, limited to price and total
stock. They do not appear among ordinary researched versions. Only one open draft
per member remains permitted. New conversation metadata is stored in existing JSON;
no schema migration is required. Old active states are adapted on load. On rollback,
stop the new poller before reverting the app/worker; drafts in new edit-menu states
must be resumed on this release or explicitly cancelled with `/cancel` before using
the older poller. Retain evidence and drafts; never roll back shop transactions.

Studio previews decode images from REST `steps[type=model_output].content`, rather
than relying on the SDK-only `output_image` convenience property. Thought and
signature blocks are ignored. Only a completed response with valid image bytes
can become an edited preview; local privacy checks still run before and after AI.
The bot labels original and studio images separately, requests an edited preview
only when one exists, and reports editing/delivery failures explicitly. Failed
comparisons cannot be approved from the new message. Existing failed edits can be
retried from the photo review with **Retry editing**; no re-upload is necessary.
The studio prompt preserves the real product and all visible damage and wear.
