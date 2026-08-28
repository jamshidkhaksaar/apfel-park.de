# Apfel Park Full Application Audit

**Audit date:** 2026-08-27–28
**Scope:** Next.js repository, public storefront, ecommerce, admin, APIs, Server Actions, PostgreSQL, authentication, payments, accessibility, SEO, deployment and live VPS operations.
**Deployed release:** `/srv/apfel-park/app/releases/20260828T104506Z-stripe-status-fix`

## 1. Executive summary

The audit discovered and resolved a production outage caused by a full root filesystem, plus high-impact access-control, payment-state, webhook, inventory, responsive-layout and accessibility defects. The product, branding, URLs, legal copy, truthful catalog data and server-authoritative commerce calculations were preserved.

The final candidate passes 325 tests, ESLint, standalone TypeScript and a warning-free Next.js production build. The targeted source browser matrix passes in light/dark themes with zero axe violations and zero horizontal overflow on tested critical routes.

## 2. Architecture

- Next.js 16 App Router, React 19, TypeScript and Tailwind CSS 4.
- React Server Components by default with targeted client components.
- PostgreSQL 16 using `pg` and a custom typed query/data layer.
- Custom signed admin sessions with database-backed current-role validation.
- Stripe hosted Checkout and embedded PaymentIntent flows; PayPal create/capture/webhook flow.
- Server-authoritative Cart validation, coupons, VAT, provider amounts and inventory ledger.
- Nginx owns public upload delivery; private review/trade-in/estimate media remains outside public storage.
- Immutable symlink releases with systemd application and marketplace worker services.

## 3. Critical production incident

Root disk usage reached 100% because immutable releases accumulated to approximately 30 GB. PostgreSQL entered recovery and checkout returned HTTP 500. Eighteen superseded releases were removed while retaining current and rollback releases, restoring approximately 26 GB. PostgreSQL exited recovery and checkout/store returned HTTP 200.

Preflight disk protection, three-release retention and a 15-minute disk watchdog were added.

## 4. Security and administration fixes

- Backup downloads and server health/log endpoints now require administrator capability.
- Customer chat and live customer/order dashboard data require order-management capability.
- Admin page paths are enforced server-side from the same role/path map used by navigation.
- Product editors are limited to Products and Inventory; unknown roles fail closed.
- Session tokens now contain signed issuance time, enforce a 14-day server expiry and reject future/tampered/legacy tokens.
- Every request-authenticated privileged route reloads the current active database user and current role.
- Branding and all repair-estimate mutations now enforce the existing cross-site mutation guard.
- PayPal capture validates local provider/order binding before obtaining a provider token or capturing funds.

## 5. Payment, order and inventory fixes

- Generic admin order forms can no longer fabricate paid status.
- Unpaid cancellation uses the transactional order/campaign/inventory release path.
- Paid cancellation requires a refund workflow; shipment/delivery requires verified paid state.
- Fulfillment updates compare-and-set the previously validated status/payment state.
- Stripe signatures enforce a five-minute timestamp window and support multiple `v1` values.
- Webhook events use an atomic claim/complete/release inbox with stale-claim takeover.
- Failed transitions release their claim for provider retry; unmatched transitions are not marked processed.
- Provider metadata can safely bind a previously missing local provider reference but conflicting references fail closed.
- Partial unique indexes prevent one provider order/session/payment reference from binding to multiple local orders.
- Provider creation uses explicit saga states and recovery after OAuth/network/reference-attachment failures.
- Indeterminate 5xx, incomplete-success and remote-ID responses retain inventory and enter reconciliation; only definitive provider rejection releases locally.
- Uncertain provider outcomes are reconciled conservatively by the marketplace worker.
- Checkout creation is protected by a shared database-backed rate limit.
- Seven historical cancelled/unpaid Stripe reservations were remotely verified, expired where necessary, released idempotently and aligned to `provider_status=expired`.

## 6. UI, responsive and theme fixes

- Introduced contrast-safe semantic gold/status/sale text tokens while preserving decorative brand gold.
- Strengthened current price, previous price and discount hierarchy.
- Cookie consent is an accessible focus-contained modal; chat is hidden while it is open.
- Mobile product purchase bar is contextual: hidden while original purchase controls are visible, shown after they pass, hidden near footer.
- Empty checkout no longer asks for personal data before identifying an empty Cart.
- Fixed 320 px Cart and legal-title clipping.
- Added branded localized root 404 recovery.
- Mobile navigation closes on Escape and restores focus.
- Corrected confirmed German grammar/umlaut errors.
- Removed nested main landmarks from trade-in and catalog routes.

## 7. Accessibility

Initial representative automation found 77 contrast nodes, a non-focusable scrolling region, missing error-document language/title and undersized controls. The final targeted source matrix reports no axe violations on home/store/contact/login, Cart, privacy, checkout empty state, current product, trade-in and catalog samples in tested themes/viewports.

Product variants expose selected state and live price/availability updates. Current and previous prices have explicit accessible labels. Related-product position remains in accessible names without unsupported ARIA attributes. Reduced motion stops JavaScript hero rotation.
EU energy grades A–G use verified contrast-safe foreground/background combinations at both arrow and compact scale sizes.

## 8. SEO

- Canonical/hreflang/sitemap/robots and local NAP were inspected.
- Duplicate brand suffixes are normalized so root metadata adds `Apfel Park` exactly once.
- Ineligible commercial FAQPage and deprecated HowTo JSON-LD were removed while visible FAQ content remains.
- Product and breadcrumb JSON-LD remain; current product source validation returned Product + BreadcrumbList.
- Public 404 is localized and recovery-oriented.

## 9. Dependency, lint and build quality

- Standalone TypeScript fixture errors and all ESLint warnings were fixed at root.
- Patched transitive `nanoid` resolution; production dependency audit reports zero vulnerabilities.
- Removed custom cache headers on Next-managed assets.
- Scoped runtime upload/private filesystem tracing; production build is warning-free.

## 10. Verification evidence

- ESLint: pass, zero warnings/errors.
- `tsc --noEmit`: pass.
- Vitest: 57 files, 325 tests pass.
- Next.js production build: pass, 130 static pages generated, no build warnings.
- PostgreSQL migrations: 35 applied, zero pending.
- Webhook claim database probe: one concurrent claim, one busy response, processed duplicate on replay.
- Dependency audit: zero vulnerabilities.
- Source browser matrix: critical routes HTTP 200, no overflow, one main/H1, targeted axe empty.
- Role matrix: product editor denied Orders/Settings/Health; admin allowed.
- Database integrity: zero uncertain outcomes, zero terminal-order reservation leaks, zero audit webhook rows.
- Live deployment: public DE/EN home, store, Cart, checkout, privacy and trade-in return 200; localized missing route returns 404.
- Live axe/browser matrix: zero violations/overflow on tested critical light/dark mobile routes.
- Live RBAC matrix: product editor denied Orders/Settings/Health and sensitive APIs; admin checks pass.

## 11. Backups and rollback

Verified artifacts:

- `/root/.hermes/backups/apfel-park/pre-audit-deploy-20260828T081610Z.dump`
- `/root/.hermes/backups/apfel-park/source-pre-audit-deploy-20260828T081610Z.tar.gz`
- `/root/.hermes/backups/apfel-park/post-reconcile-pre-deploy-20260828T091233Z.dump`

The previous live symlink release remains the immediate application rollback target. Database migrations are additive and backward-compatible.

## 12. Remaining hardening

No remaining item below is required for the verified current Stripe storefront path, but they remain worthwhile:

- Add cumulative refunded-amount persistence and net-revenue accounting for partial refunds.
- Implement PayPal `PAYMENT.CAPTURE.REFUNDED` handling before enabling PayPal publicly.
- Make product + inventory + homepage-feature synchronization one database transaction.
- Couple product-intake decision and revision allocation atomically.
- Add chat message caps, pagination and post-session durable throttling.
- Add strict runtime schemas and last-admin/self-disable protection to remaining admin settings/user workflows.
- Implement integration-aware CSP and Permissions-Policy after testing Stripe/reCAPTCHA/maps/analytics.
- Add checked-in CI for lint, TypeScript, tests, audit and build.
