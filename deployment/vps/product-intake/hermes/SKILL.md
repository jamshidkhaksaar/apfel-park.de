---
name: apfel-product-intake-v2
description: "Condition-first, vision-assisted Apfel Park product add/update proposals through n8n v2. Shadow mode only until the owner completes the pilot."
version: 2.0.0
author: Apfel Park
metadata:
  hermes:
    tags: [apfel-park, product-intake, vision, barcode, n8n]
---

# Apfel Park Product Intake v2

## Authority

- Safi may submit through the dedicated intake bot.
- Only the configured owner may approve, reject, request changes, or publish.
- This workflow is SHADOW MODE until the owner explicitly completes the pilot. Never claim a product or stock changed when the API says `shadowMode: true`.
- Never use direct PostgreSQL, `publish_product.py`, the legacy draft endpoint, Gemini identification, or Nano Banana.

## Condition-first intake

Before research or vision, obtain exactly one condition:

1. `sealed` — unopened packaging.
2. `open_box` — packaging opened; exact-item photos and About screenshot required.
3. `used` — exact-item photos, About screenshot, condition note, and Battery Health screenshot for iPhones.

Also obtain add/update intent, model/storage/colour, website price, quantity, and for updates whether quantity means `set` or `add`. Ask for GTIN and MPN when not visible on the barcode label.

## Vision sequence

1. Save each attachment under `/srv/apfel-intake/submissions/<APF-CODE>/` with mode 0600.
2. POST it to the localhost vision service:

```bash
curl -fsS http://127.0.0.1:8730/extract \
  -H "X-Vision-Token: $APFEL_INTAKE_VISION_TOKEN" \
  -F "run_id=<APF-CODE>" \
  -F "asset_type=barcode_label|about_screen|battery_health|condition_photo|packaging" \
  -F "image=@<local-path>"
```

3. Register only the redacted derivative through `intake_client.py asset`. Use an asset key relative to `/srv/n8n/media`, rights `shop_owned`, `isRedacted=true`, `containsSensitiveIdentifiers=false`, and `externalProcessingAllowed=true`.
4. For Safi submissions, load the run and its short-lived redacted URLs with `intake_client.py get --json <run-id.json>` where the JSON is `{ "runId": "APF-8K2M..." }` or the internal UUID.
5. Call Hermes `vision_analyze` with each `visionUrl` and the exact `solVisionPrompt` returned by the local extractor. The configured Sol 5.6 model must perform this pass.
6. Append the completed semantic result with `intake_client.py analysis`. Send `{ "runId", "assetId", "analysis": { "semanticType": "barcode_label|about_screen|battery_health", "model": "gpt-5.6-sol", "result": { ... } } }`. The application joins this append-only result to the immutable redacted asset. Never mark a pass complete when the model failed.
7. POST the local decoder/OCR results plus Sol outputs to `http://127.0.0.1:8730/merge` with the vision token. Use its deterministic merged result; do not merge conflicting identifiers in prose.
8. Merge results conservatively:
   - Checksum-valid barcode decoder output wins for GTIN.
   - OCR + Sol agreement is high confidence.
   - A Sol-only digit string is never accepted; ask the owner to confirm.
   - Ignore editable device `Name`; use `Model Name`, hardware model, and manufacturer part number.
   - Never reconstruct blacked-out values.
9. Full IMEI, serial, EID, or any standalone 15/32-digit sensitive identifier must never enter JSON, logs, n8n, memory, or replies.

## Research and proposal

Use only manufacturer documentation, EPREL, GS1, licensed distributor sources, or existing shop records. Third-party pages may reveal a conflict but cannot provide published facts.

Before submitting a proposal, send its declared source list through `intake_client.py research`; APF-04 must accept every domain. A successful source check does not replace field-level fact/value validation in the application.

Create the intake run through:

```bash
/root/.hermes/skills/apfel-park/apfel-product-intake-v2/intake_client.py start --json <start.json>
```

Submit evidence/proposal through `intake_client.py proposal`. Proposal schema version is 2. Updates change price and inventory only. Ambiguous matching remains blocked. Every proposed field must include `field`, `value`, `sourceUrl`, `sourceType`, `retrievedAt`, and `confidence`; the source URL must also appear in `sources`. Use an Apfel Park `shop_record` source for Safi-supplied price, quantity, condition and included-accessory facts, and official sources for manufacturer facts. Include concise German and English listing previews. Keep Apple sales MPN and the `Axxxx` hardware model in separate fields. For Samsung, store the `SM-...` hardware model explicitly and repeat it as MPN evidence only when the official source uses it as the manufacturer part number.

The review message must show run ID, add/update recommendation, match strategy, condition, price, set/add quantity, SKU/GTIN/MPN, vision conflicts, image rights, sources, blockers, warnings, and DE/EN copy summary.

## Owner decisions

Translate owner commands to decision JSON and send through n8n:

```text
approve-draft APF-XXXXXXXX
publish APF-XXXXXXXX
edit APF-XXXXXXXX: feedback
reject APF-XXXXXXXX: reason
```

Use `intake_client.py decision`. Approval uses the current `proposalHash`. New products require two approvals; updates require one. In shadow mode, report that the approval was audited but no product or inventory mutation occurred.

## Failure rules

- Blurred barcode: request a sharper photo.
- Invalid GTIN checksum: block.
- Box/About mismatch: block and show both values.
- Missing exact photos for Open-Box/Used: block.
- Missing Battery Health for used iPhone: block.
- Unknown image rights: block.
- n8n or app unavailable: retain the local session and offer retry; never fall back to direct DB.
