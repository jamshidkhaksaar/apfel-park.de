# Apfel Park Audit Action Plan

## Completed before deployment

- [x] Restore disk capacity and PostgreSQL/checkout availability.
- [x] Add release retention, disk preflight and disk watchdog.
- [x] Fix TypeScript, ESLint and dependency audit findings.
- [x] Enforce session expiry and current active-user role validation.
- [x] Enforce admin page/API capability boundaries.
- [x] Restrict database/private-media backup and server health data.
- [x] Add missing CSRF enforcement.
- [x] Protect PayPal capture with local binding before provider access.
- [x] Add atomic webhook claims and fail-retry processing.
- [x] Add explicit transition outcomes and conflict-safe provider binding.
- [x] Make admin fulfillment compare-and-set safe.
- [x] Add checkout throttling and uncertain-provider reconciliation.
- [x] Reconcile historical cancelled-order inventory reservations.
- [x] Resolve mobile consent, purchase-bar, Cart, checkout, legal and 404 defects.
- [x] Resolve representative WCAG/light-dark contrast and semantics findings.
- [x] Remove ineligible commercial FAQ/HowTo schema and duplicate brand titles.
- [x] Pass full lint, TypeScript, 319 tests and warning-free build.
- [x] Create and verify database/source backups.

## Next: operational monitoring

1. Monitor `apfel-park-marketplace-worker` for `provider reconciliation` errors.
2. Monitor webhook claim rows with `processed_at IS NULL` and non-null `last_error`.
3. Confirm disk watchdog remains silent below 85% usage.
4. Add alerts for uncertain provider outcomes older than their reconciliation windows.

## High-value follow-up

1. Persist cumulative refund amounts and report net revenue after partial refunds.
2. Add PayPal refund webhook handling before enabling PayPal.
3. Refactor product/inventory/featured writes into one transaction.
4. Make product-intake decision and revision allocation atomic/idempotent.
5. Add durable chat message rate limits, transcript caps and pagination.
6. Add strict schemas for remaining settings/media/SEO/user mutations.
7. Add last-active-admin and self-disable/delete safeguards.
8. Add accessible dialog/tab/switch primitives across remaining admin UI.
9. Introduce separate essential-control and decorative-divider border tokens.
10. Add CSP/Permissions-Policy only after integration-aware report-only testing.
11. Add checked-in CI gates for lint, TypeScript, tests, dependency audit and build.
