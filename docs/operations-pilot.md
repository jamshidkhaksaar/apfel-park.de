# Kasse & Lager: reliable pilot

The till stays training-only: no payment, fiscal receipt, or stock decrement.
Purchases, transfers, expenses and device cost edits are real management writes.
Each goes through a read-only ten-minute preview and explicit confirmation.
The signed preview binds actor, request key, body hash and timestamp/version
snapshot. Confirmation checks those versions under locks. A changed snapshot
returns 409; a committed retry returns its immutable original document.

Overview is a daily action screen. Reports has period totals, preceding-period
comparisons, detailed lists and CSV exports. Stock cards are explicitly current
snapshots. The shared buffer is subtracted once globally; individual branch
capacities are not additive. Inactive stock is physical inventory, not sellable.

Report totals are SQL aggregates over the complete selected period. Historical
orders without a complete single-branch allocation are unassigned. Known full
refunds refer to the selected sales cohort; refund dates and partial amounts are
not invented. Missing cost/fee/net/refund evidence suppresses complete profit.

The worker records branch/asset consistency diagnostics every 15 minutes. A
diagnostic failure does not block existing marketplace processing. It never
rewrites identities, costs or financial history automatically.

Migration 20261006_operations_pilot.sql adds indexes and fills only empty,
unambiguous SKU-variant color/storage. It leaves serials, IMEIs, batteries,
costs, tax modes, ledger quantities, and membership grants unchanged.

Verification: Vitest, lint, typecheck, unused-source/security audit, production
build, runtime upload regression; scripts/integration/operations-db.ts tests
synthetic PostgreSQL. The production rehearsal backs up and restores privately,
then migrates a separate database. Browser fixture runs on localhost 3120, not
the production port. No fictitious receiving/transfers belong in production.

Releases use the canonical exact-ref atomic VPS process and preserve the prior
release. Final authenticated owner review and restricted-cashier pilot testing
remain required before declaring the workflow staff-ready.
