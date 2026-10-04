# Kasse & Lager rollout

This release provides branch allocations tied to the existing aggregate inventory ledger, purchase receiving, private device records, stock transfers, Code 128 labels, owner reporting, cashier access and a **training-only** till.

The complete approved plan is broader than this release. Live POS payment/fiscal receipt processing, register cash closing, payment-provider refunds/exchanges, mixed tax regimes and final accounting exports remain gated for the next stage. No administrator setting can turn this training till into a live till in this release. TSE provider/terminal/printer details and the applicable tax regimes must be confirmed before the corresponding integrations are built and enabled.

## Roles

Existing administrators have owner access. Assign an existing user owner access or cashier access to a branch in the new Settings view. A cashier account cannot use the old product, order or finance administration. A new cashier without a branch assignment sees an assignment message and no business records. Assigning access invalidates the user's previous sessions.

## Inventory model

`inventory_skus(location='local')` remains the authoritative aggregate for website checkout, feeds and enabled marketplace synchronization. `ops_balances` partitions those same quantities and reservations into physical branches; it is not a second independent stock total. Deferred reconciliation covers legacy catalog editors that directly upsert aggregate inventory. Transfers retain aggregate on-hand and hold stock reserved in a private transit location until receipt.

Online shipping orders select one active branch capable of the whole cart. Pickup orders use the primary Wilhelmsburg branch. A cart that would require an unapproved split shipment is rejected before provider checkout. Product delivery/pickup copy and the Google local feed/API distinguish primary-branch stock from online aggregate stock.

Opening device records intentionally have unknown costs and identifiers. They are placeholders for each physical unit, not a claim that a serial number has been verified. Register exact identifiers and costs before relying on individual-device accounting. Stock corrections are audited; historical cost-consumption records and document snapshots are append-only.

## Configuration and deployment

1. Run the isolated database regression script with the app env; it creates a separate local database and never migrates production. Retain or explicitly remove its named test databases after verification.
2. Run `node scripts/operations-configure.mjs` as root. It adds an encryption key only when absent, preserves existing env values and ownership, and creates a protected backup. Never rotate this key without migrating encrypted identifiers.
3. Commit and push the isolated worktree, then deploy the exact commit through `bash scripts/deploy.sh <sha>`. The registered owner migration creates a database backup before applying the additive schema changes.
4. Verify aggregate/branch balances, representative storefront pages, local inventory feed, protected API responses and owner/cashier views. Keep the previous release for code rollback. Never reverse applied financial migrations as a code rollback.
5. Add the second branch only with its real details. Receive or transfer actual units explicitly; do not duplicate the main shop's opening stock.

## Reporting limits

Website revenue comes from captured orders. Full refunds can be recognized from their stored status. Partial-refund amounts are incomplete until a detailed money-refund ledger is implemented. Earlier physical-shop stock decrements have no recorded sale price; they cannot be presented as shop revenue. Missing costs, missing payment fees and unpriced shop movements suppress the operating-result estimate.

Purchase outlays, sales cost, shipping charged, actual shipping expense and payment fees are separate fields. Only confirmed recoverable purchase VAT is excluded from acquisition cost. Reports are operational views of entered records, not certified statutory accounts or a tax return. CSV exports contain the report metrics and completeness flags.

## Verification

Use synthetic data for write tests and UI fixtures. Production smoke checks should be read-only. The fixture server binds localhost on port 3118, never production port 3000. Printed sample receipts say **ÜBUNGSBELEG - KEIN VERKAUF** and cannot be used as customer fiscal receipts.

The design-hook footer findings in AdminShell are existing transparent alignment borders, not decorative accent borders. They were reviewed and retained without adding ignore rules.
