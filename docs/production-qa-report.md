# Production QA Report

Date: 2026-05-13

## Implemented

- Added cart, checkout, success, and cancel routes for German and English storefronts.
- Added server-side cart validation against the `products` table; checkout totals are never trusted from the browser.
- Added Stripe Checkout Session creation and signed Stripe webhook handling.
- Added PayPal order create, capture, and webhook handling with fail-closed webhook verification through `PAYPAL_WEBHOOK_ID`.
- Extended order persistence via migration for provider references, payment status, VAT, shipping, customer details, idempotency keys, and webhook audit events.
- Updated admin payments page to show readiness from environment variables, sandbox/live mode, VAT/currency, and latest webhook events.
- Updated admin orders list/export with payment provider, payment status, shipping method, customer email, and currency.
- Added consent-aware browser event dispatch for page view, view item, add to cart, begin checkout, lead/contact, WhatsApp click, and purchase.
- Added server-side Meta/TikTok purchase events after verified provider payment.
- Added product sitemap entries and Product/Breadcrumb JSON-LD on product detail pages.
- Added Organization and WebSite JSON-LD globally.
- Improved product detail purchase hierarchy with add-to-cart, buy-now, inquiry fallback, shipping/payment/VAT reassurance, and sticky mobile CTA.
- Added repeatable local QA script: `npm run qa:production`.
- Replaced admin hero media preview `<img>` tags with `next/image`, removing the remaining lint warnings.
- Fixed cart localStorage snapshot caching to prevent React update-depth crashes in production.
- Added same-origin CSRF protection for admin mutation APIs.
- Removed `shared/app.env` from the default admin app backup archive.

## Verification

- `npm run lint` passes with no warnings.
- `npm run build` passes and includes the new checkout and webhook routes.
- `npm run qa:production` passes 20/20 local tests against `http://127.0.0.1:3000`.
- Local QA covered: homepage, store, product detail, cart, checkout, contact, privacy, Impressum, sitemap, robots, valid cart validation, invalid cart rejection, invalid contact/repair rejection, cross-site admin mutation rejection, unauthenticated admin export rejection, missing payment config fail-closed behavior, and bad Stripe/PayPal webhook rejection/fail-closed behavior.
- Checkout/payment migration has been applied to local PostgreSQL for the live service.

## Legal / Compliance Flags

- Confirm final legal entity/owner wording before live checkout.
- Confirm refund/return policy, shipping policy, VAT/invoice wording, and payment-provider disclosures with counsel or a qualified German/EU compliance reviewer.
- Cookie/tracking copy should be reviewed once real GA4/Meta/TikTok IDs and server-side event usage are enabled.

## Remaining Manual QA

- Test Stripe sandbox success, cancel, expired session, and duplicate webhook replay.
- Test PayPal sandbox approve/cancel/capture and duplicate webhook replay.
- Confirm product stock/variant edge cases with stale carts.
- Verify GA4 DebugView, Meta Test Events, and TikTok test events after consent.
- Run mobile checkout smoke tests on `/de/cart`, `/de/checkout`, `/en/cart`, and `/en/checkout`.
- Run real browser console checks with analytics/ad blockers disabled when GA4/Meta/TikTok credentials are configured.
