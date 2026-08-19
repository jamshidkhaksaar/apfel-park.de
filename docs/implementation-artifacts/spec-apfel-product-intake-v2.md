---
title: 'Apfel Park Automated Product Intake v2'
type: 'feature'
created: '2026-08-19'
status: 'done'
baseline_commit: '8920203c0d32e818ced5e7eb57ca728e685d7035'
context:
  - 'CLAUDE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The existing Hermes/n8n product workflow is photo-first, has no durable proposal audit, trusts generative vision for identifiers, bypasses authoritative inventory/channel synchronization, and cannot safely distinguish add versus update across Sealed, Open-Box, and Used devices.

**Approach:** Add a durable application-owned intake system, deterministic barcode/OCR plus redacted Sol 5.6 vision extraction, condition-aware official-source research, Telegram/admin review, and idempotent application through shared product and inventory services. Deploy n8n v2 in shadow mode beside the archived v1 workflow.

## Boundaries & Constraints

**Always:** Ask condition before research; accept Safi submissions through the restricted bilingual bot and Jamshid through Hermes; decode/checksum barcodes before using vision; redact IMEI/serial/EID before external vision; publish only officially sourced facts; require shop-owned exact photos for Open-Box/Used; require valid identifiers or documented exception for phones/tablets; use two approvals for new products; update only price/inventory for existing matches by default; preserve slugs/content/images; write stock only through the inventory ledger; record sources, rights, events, actors, hashes, and idempotency keys.

**Ask First:** Publishing a real pilot product, configuring licensed manufacturer portals, disabling v1 before ten successful v2 runs/seven stable days, or retaining any sensitive device identifier for a future warranty use case.

**Never:** Expose Safi to unrestricted Hermes tools; use IMEI as GTIN; store full IMEI/serial/EID; send unredacted About/barcode screenshots to an LLM or n8n; scrape public manufacturer imagery as copyright-free; alter official renders; use Nano Banana in the normal path; let Hermes/n8n write PostgreSQL directly; auto-apply ambiguous matches; reduce stock below reservations.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Sealed add | Box barcode, shop photo, model, price, quantity | Validated identifiers, official evidence, inactive draft, signed preview | Missing/invalid identifier or rights blocks draft publication |
| Existing update | Exact SKU/GTIN match, price, quantity set/add | Price/inventory-only proposal and one-step apply | Ambiguous match requires owner selection |
| Open-Box/Used | About screenshot and exact photos | Redacted vision extraction, condition evidence, separate offer/SKU | Missing exact photos/note/battery health blocks publication |
| Mixed barcodes | EAN plus IMEI/serial | EAN accepted only if checksum-valid; sensitive values discarded | Vision-only/conflicting digits require confirmation |
| Retry/failure | Replayed request or n8n/marketplace outage | One run/adjustment, retryable state, no partial mutation | Alert Jamshid; preserve audit and last-known-good store state |

</frozen-after-approval>

## Code Map

- `src/app/api/integrations/product-intake/` -- authenticated run, proposal, decision, asset, preview, and apply interfaces.
- `src/lib/product-intake/` -- schemas, HMAC, matching, validation, audit, preview tokens, and atomic product/inventory application.
- `src/app/admin/product-intake/` -- Jamshid-only proposal queue and review detail.
- `deployment/vps/product-intake/` -- versioned vision helper, Safi bot, Hermes skill/bridge, n8n v2 workflows, retention and deployment scripts.
- `supabase/migrations/` -- intake runs/assets/events, indexes, roles, status constraints, and inactive draft inventory support.

## Tasks & Acceptance

**Execution:**
- [x] Add migration-backed intake runs, assets and append-only events with indexed statuses/idempotency.
- [x] Implement signed integration APIs, official-source proposal validation, safe product matching, draft preview and role-gated decisions.
- [x] Extract shared product writing; apply price updates and ledger set/add atomically; queue enabled channels.
- [x] Build responsive Telegram-aligned admin queue with evidence, image rights, conflicts, readiness and audit.
- [x] Build local barcode/OCR/redaction service; route only redacted derivatives to Sol 5.6 and fail closed on conflicts.
- [x] Upgrade Safi bot to persistent condition-first intake and add Jamshid-only Hermes approval commands.
- [x] Export/archive v1; add inactive APF-01..07/99 n8n v2 workflows without Wait/resume capability URLs or Gemini/Nano Banana.
- [x] Rotate the exposed draft token, move secrets to protected env files, back up SQLite/Hermes/bot state, and configure cleanup/redaction.
- [x] Add unit, integration, migration, browser and shadow-mode acceptance tests.

**Acceptance Criteria:**
- Given any intake, when condition is absent, then no research starts and the submitter is prompted for Sealed/Open-Box/Used.
- Given barcode/About images, when extraction runs, then valid public identifiers are evidenced while IMEI/serial/EID are absent from n8n, logs, proposals and previews.
- Given an existing match, when Jamshid approves, then only price and ledger stock change and retries cannot duplicate adjustments.
- Given a new valid device, when first approved, then it remains inactive with a signed noindex preview until a second Jamshid approval.
- Given missing official facts, image rights, exact condition evidence or strict device identifiers, when publish is requested, then publication remains blocked with actionable reasons.

## Spec Change Log

## Design Notes

Keep n8n stateless and short-running; the application database owns business state. Use ZXing checksum-backed results as authoritative, OCR as evidence, and Sol vision only for label/context association. Store intended inventory in inactive SKU rows for drafts; activate and queue channels only at publication.

## Verification

**Commands:**
- `npm run lint -- --max-warnings=0` -- no warnings.
- `npm test` -- all existing and intake tests pass.
- `npm run build` -- Next.js production build succeeds.
- `python -m unittest discover -s deployment/vps/product-intake/vision/tests -v` -- barcode, pixel-redaction, merge, cleanup and privacy fixtures pass.
- `docker compose config` and n8n workflow import validation -- deploy assets parse without secrets.

**Manual checks:**
- Verify admin queue at 320, 768, 1024 and 1440 px with a clean console.
- Run shadow Sealed/Open-Box/Used fixtures; confirm no product/database mutation and compare Telegram/dashboard proposals.

**Completed local evidence (2026-08-19):**
- `npm run lint` passed with no warnings.
- `npm test` passed: 30 files / 237 tests.
- `npm run build` passed; only the repository's pre-existing repair-estimate tracing and custom Cache-Control warnings remain.
- Vision/privacy suite passed: 13 tests, including German split-token/line serial and multi-barcode pixel redaction; Hermes canonical-HMAC suite passed: 1 test.
- Generated n8n suite passed: eight inactive workflows, APF-99 error routing, no Wait nodes, owner gating, exact raw-body HMAC forwarding, and sensitive-payload rejection.
- Browser fixture passed at 320, 768, 1024 and 1440 px with no horizontal overflow and zero console errors. The first 320 px run exposed an intrinsic grid-width bug; `minmax(0,1fr)`/`min-w-0` containment was added and the rerun passed.
- `verify-migration.sql` is transactional and is executed automatically by `deploy-shadow.sh` after application migrations; the live PostgreSQL execution remains part of deployment verification.
- Three fresh reviewers completed blind, edge-path and acceptance audits. Valid findings were patched: explicit approval stages and stable idempotency, evidence-set hashing and approval-time revalidation, append-only Sol analyses, exact fact/value/source binding, strong live-match gating, run-level apply locks, stale-draft detection, variant price updates, German/split serial redaction, no-persist n8n workflows, split submit/owner app keys, host-network Safi connectivity, tracked migration verification, and fail-closed deployment rollback/health checks.

## Suggested Review Order

**Durable intake lifecycle**

- Proposal snapshots bind matching, facts, assets, rights, and Sol results before review.
  [`repository.ts:572`](../../src/lib/product-intake/repository.ts#L572)

- Database constraints make runs durable and audit records append-only.
  [`20260819_product_intake_core.sql:22`](../../supabase/migrations/20260819_product_intake_core.sql#L22)

- Sol results append beside immutable redacted assets instead of rewriting evidence.
  [`repository.ts:451`](../../src/lib/product-intake/repository.ts#L451)

- Decisions revalidate evidence under lock and enforce explicit approval stages.
  [`repository.ts:630`](../../src/lib/product-intake/repository.ts#L630)

**Atomic application and publication**

- Existing updates lock runs, update exact variants, and use ledger idempotency.
  [`apply.ts:95`](../../src/lib/product-intake/apply.ts#L95)

- First approval creates an inactive product and inactive inventory draft.
  [`apply.ts:252`](../../src/lib/product-intake/apply.ts#L252)

- Final publication rejects drift before activating inventory and channel synchronization.
  [`apply.ts:445`](../../src/lib/product-intake/apply.ts#L445)

**Validation and matching trust boundaries**

- Field evidence must match proposal values and permitted source types.
  [`validation.ts:76`](../../src/lib/product-intake/validation.ts#L76)

- Matching cross-checks every supplied identifier and keeps weak model matches advisory.
  [`matching.ts:74`](../../src/lib/product-intake/matching.ts#L74)

- Strict schemas gate proposals, explicit stages, identifiers, and analysis payloads.
  [`schemas.ts:247`](../../src/lib/product-intake/schemas.ts#L247)

**Vision privacy and operator flow**

- Deterministic OCR/barcode masking handles German split serial labels before Sol.
  [`extractor.py:163`](../../deployment/vps/product-intake/vision/extractor.py#L163)

- Safi receives a persistent bilingual, condition-first, privacy-screened intake flow.
  [`bot.py:175`](../../deployment/vps/product-intake/safi-bot/bot.py#L175)

- n8n verifies scoped HMAC requests without persisting intake execution payloads.
  [`build_workflows.py:28`](../../deployment/vps/product-intake/n8n/build_workflows.py#L28)

**Deployment and rollback**

- Shadow deployment preflights migrations, backups, health, credentials, and rollback.
  [`deploy-shadow.sh:97`](../../deployment/vps/product-intake/deploy-shadow.sh#L97)

**Review interface and verification**

- Responsive queue keeps owner decisions explicit and retry-idempotent.
  [`AdminProductIntakeQueue.tsx:11`](../../src/components/admin/AdminProductIntakeQueue.tsx#L11)

- Evidence, readiness, candidates, rights, and audit remain visible together.
  [`ProductIntakeRunDetail.tsx:21`](../../src/components/admin/ProductIntakeRunDetail.tsx#L21)

- Application tests cover HMAC, matching, evidence, approvals, inventory, and previews.
  [`product-intake.test.ts:18`](../../src/lib/__tests__/product-intake.test.ts#L18)

- Pixel tests prove German serial and repeated barcode regions are masked.
  [`test_redaction_pixels.py:25`](../../deployment/vps/product-intake/vision/tests/test_redaction_pixels.py#L25)

- Generated-workflow tests enforce inactivity, no-Wait, privacy, keys, and exact bodies.
  [`test_generated_workflows.cjs:123`](../../deployment/vps/product-intake/n8n/test_generated_workflows.cjs#L123)
