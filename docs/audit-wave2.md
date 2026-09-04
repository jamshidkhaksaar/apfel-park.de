# Audit wave 2: accessibility and isolated payment verification

## Application changes

- F01/F05: dedicated skip-link reveal selector; coupon label and feedback association.
- F02/F03: mobile admin navigation visibility, modal keyboard lifecycle, native command dialog, combobox active-result linkage and shared nested scroll-lock ownership.
- F04/F11/F12: native top-layer product gallery with viewport bounds, stable open/close focus lifecycle, localized controls and selected-image announcements.
- F06: theme selection moves keyboard focus; quick-add uses native labeled radio groups.
- F07: mobile filters release effects at the desktop breakpoint, restoring only connected/visible focus destinations without stale deferred callbacks.
- F08: mini-cart validation errors are recoverable and distinct from empty/loading states; saved selection is retained and stale responses cannot overwrite a newer request.
- F09: consent panel is bounded and scrollable on short viewports/enlarged text.
- F10: EPREL has a persistent label, recoverable request errors, distinct empty/loading/results states and narrow-screen stacking.
- Repair benchmark unit test isolates its environment while separately checking configured defaults; application publication policy is unchanged.

## Repeatable checks

Use Node 24.14.x and npm 11.12.x. Run unit gates from a clean environment, never an inherited production app.env shell.

```
npm test
npm run typecheck
npm run lint
npm audit --audit-level=high
npm run build
node scripts/public-ui-regression.mjs
node scripts/product-gallery.browser-test.mjs focus
node scripts/product-gallery.browser-test.mjs bounds
node scripts/product-gallery.browser-test.mjs locale
node --test src/components/checkout/__tests__/cart-ui.browser.mjs
node src/components/admin/__tests__/admin-ui.chromium.mjs
python3 -m unittest discover -s scripts/integration/__tests__ -v
python3 scripts/integration/run-payment-db.py
```

Browser fixtures require Playwright/Chromium supplied by the operator. Existing local default is `/root/apfel-audit/browser/node_modules/playwright`; use each script's documented environment override elsewhere. They bundle actual components with esbuild; public/gallery/admin fixtures include actual application CSS. These explicit scripts are **not** part of the default Vitest suite. Cart's fixture intentionally verifies behavior without the application stylesheet.

The opt-in database runner requires local postgres administration and refuses existing `apfel_audit_wave2` database/role handles. It creates only synthetic data, uses a clean environment with no provider credentials, executes actual checkout/inventory helpers, then deletes/verifies its exact resources. Catchable signals request child shutdown and cleanup; SIGKILL/host failure cannot guarantee cleanup and require explicit inspection, not blind deletion. No production DB is used by this runner.

## Evidence boundaries

Seven database cases cover reservation/cancellation idempotency, exact timestamps, paid-state protection, mocked Stripe expiry/protection, last-unit buyers, helper-level retries and transaction rollback. Provider calls are mocked. This is **not** Stripe/PayPal sandbox certification, full migration parity, webhook/refund coverage, route-level checkout idempotency certification or concurrent remote-capture correctness.

The staging storefront matrix uses public product data and an isolated read-only role, with no customer accounts/orders/provider credentials. Admin fixtures mock authentication/context boundaries: role rendering is covered, server authorization is not established by these tests. Zero axe violations does not close incomplete contrast checks. Real iOS/Safari, Firefox, screen-reader speech, full browser zoom, all admin workflows and mobile performance budgets remain separate acceptance work.

Dedicated sandbox Stripe/PayPal credentials are required for real provider acceptance tests. Never substitute live charges or change the production payment mode to test this batch. No payment-processing production logic changed in wave 2.
