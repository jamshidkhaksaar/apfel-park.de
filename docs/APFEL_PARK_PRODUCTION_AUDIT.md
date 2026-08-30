# Apfel Park Production Audit and Remediation

**Audit date:** 2026-08-30
**Audited branch:** `agent/stripe-idempotency`
**Baseline commit:** `85518eb19687941031755b30fe38d4610d71548d`
**Baseline commit subject:** `style(admin): enforce black text in light theme for channel readiness and tips`
**Deployment performed:** No
**Production data/provider mutations performed:** No

## 1. Scope, safety, and repository state

This review covered the editable source at `/srv/apfel-park/app/source`, including its pre-existing uncommitted work. The initial dirty state was not reset, stashed, or overwritten wholesale. Restorable snapshots were created before audit edits:

- `/tmp/apfel-park-preaudit-85518eb1.patch`
- `/tmp/apfel-park-preaudit-untracked-85518eb1.tgz`

The initial working tree already contained subscriber/admin, repair-pricing, SEO, email, and order-transition work. Some audit fixes necessarily touched files that were already modified, but all edits were targeted. No live service restart, production symlink switch, real charge, provider checkout, production form submission, outbound email, destructive database action, or intrusive production test was performed.

The requested Browser integration was attempted first but failed because the provider returned no CDP endpoint. The documented fallback was Playwright 1.62.1 in `/tmp/apfel-playwright`; it did not change repository dependencies. Lighthouse 13.4.1 and axe were run against an isolated production build on `127.0.0.1:3105` with `PAYMENT_MODE=sandbox`. The isolated server was stopped and port 3105 verified free after testing.

## 2. Detected architecture and integrations

| Area | Detected implementation |
|---|---|
| Framework | Next.js 16 App Router, standalone output, proxy boundary |
| UI runtime | React / React DOM 19.2 |
| Language | TypeScript 5.9, strict project type-check |
| Styling | Tailwind CSS 4 plus semantic CSS variables in `src/app/globals.css` |
| Package manager | npm, lockfile v3 |
| Production runtime | Node 24.14.0 LTS, self-hosted systemd/Nginx |
| Database | Local PostgreSQL through `pg` and repository DB adapters |
| Catalog truth | `products`; inventory overlay from `inventory_skus` |
| Stock truth | Reservation ledger in `inventory_skus` / `inventory_adjustments`; compatibility fallback remains in `products.stock` |
| Order truth | Local `orders`; Stripe/PayPal signed state is authoritative for payment transitions |
| Authentication | HMAC-signed application session; role helpers and route/path guards |
| Payments | Stripe hosted Checkout, Stripe Payment Element, PayPal create/capture, signed/idempotent webhooks |
| Email | SMTP/Nodemailer plus local mailserver administration |
| Storage | Shared local uploads/private storage; Sharp image processing |
| Analytics/consent | GA/Meta/TikTok/review integrations behind consent; map consent now purpose-specific |
| Internationalization | German and English localized routes and metadata |
| Testing | Vitest Node suite plus temporary Playwright/axe/Lighthouse audit harness |
| Deployment | Commit-addressed release directories, `current` symlink, systemd app + marketplace worker |

### Route inventory

The audit mapped 40 customer page files, 83 API route files, 20 exported Server Actions in 11 modules, admin routes, 404/error handling, feeds, robots, sitemap, and tokenized preview routes. The final production build reported 135 generated pages and all expected dynamic routes.

### Production-sensitive boundaries kept out of tests

- No Stripe/PayPal object was created, captured, canceled, or refunded during QA.
- No production contact, repair, withdrawal, newsletter, chat-start, or review submission was sent.
- No product, stock, order, customer, repair, campaign, or admin record was written during browser QA.
- No systemd/Nginx production configuration was activated.
- Admin routes were tested only as unauthenticated redirects/denials and through source/unit review.

## 3. Source-of-truth rules

- **Products/prices:** server reads `products` and variant JSON; checkout ignores client names/prices and recalculates authoritative amounts.
- **Stock:** `inventory_skus` is intended authority. The remaining `products.stock` fallback is documented technical debt and must not be treated as a second writable authority.
- **Orders:** `orders` stores the authoritative customer/item/total/fulfillment snapshot; payment transitions require provider proof.
- **Store information:** `siteInfo` and reviewed store settings are used; unsupported optional schema claims were removed.
- **Claims:** ratings, testimonials, partner/reseller status, blanket warranty periods, repair volume/speed, payment methods, competitor comparisons, coordinates, price range, and rolling offer dates are not emitted unless supported by an authoritative source.

## 4. Measurable baseline

### CLI baseline

| Gate | Baseline result |
|---|---|
| `npm ci` | Pass; lock hash unchanged |
| ESLint | Pass with pre-existing warnings |
| `tsc --noEmit` | Pass |
| Vitest | 61 files / 335 tests passed |
| Production build | Pass |
| npm audit | 0 reported vulnerabilities at that time |
| Configured E2E | None in repository |
| CI | None in repository |

The npm audit result was not sufficient evidence of framework safety: the current official Next.js/React security release required upgrading even though npm audit initially showed zero.

### Browser baseline

Representative home, store, category/filter, search, product, cart, checkout entry, repairs, contact, legal, 404, login, and protected admin routes rendered without framework overlays. Safe interactions covered consent, theme persistence, mobile menu, filter sheet, search edge cases, cart quantity/removal, checkout entry, and invalid contact submission.

### Store-width baseline

The shared `.container-page` was capped at 80rem/1280px. At a 1920px viewport this created 320px outer margins on both sides before the 24px internal padding. The product grid remained only 952px wide and four columns.

### Accessibility baseline

Axe ran 32 route/theme/viewport combinations and found **9 rule instances / 319 violating nodes**, concentrated in repair contrast, scrollable repair tables, store/cart contrast, and light-theme transient states.

### Lighthouse baseline (single lab run)

| Route/profile | Perf | A11y | Best | SEO | FCP | LCP | TBT | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Home mobile | 51 | 100 | 100 | 100 | 2.9s | 9.2s | 610ms | 0 | 1,621 KiB |
| Store mobile | 56 | 100 | 100 | 100 | 1.5s | 11.4s | 740ms | 0 | 2,384 KiB |
| Store desktop | 87 | 97 | 100 | 100 | 0.4s | 2.3s | 10ms | 0.003 | 2,594 KiB |

These are lab measurements, not field Core Web Vitals.

## 5. Findings by severity

### P0 — critical

1. **Purpose-confused consent:** loading a map granted site-wide analytics/marketing consent. **Fixed** with separate map consent.
2. **Unsupported competitor comparison/schema:** hard-coded competitor prices and “lowest” comparison could be published without per-cell evidence. **Mitigated:** page remains at its URL but is `noindex` and displays an evidence-review state unless explicitly verified.
3. **Feed fabrication/fail-open:** Meta feed invented stock/brand/location-radius values; feed DB failure could look like a valid empty catalog. **Fixed.**
4. **Deployment rollback split-brain:** failed release rollback restarted the web app but not the marketplace worker. **Fixed in tracked deployment workflow.** Schema rollback remains expand/contract only.

### P1 — high

1. **Indefinite or incorrect unpaid reservations:** normal abandoned states were omitted, succeeded Stripe recovery did not mark local orders paid, and PayPal stale cancellation lacked provider lookup. **Fixed** with provider-authoritative amount/currency/identity checks, idempotent paid transitions, failed-intent expiry, and two-pass PayPal expiry fencing.
2. **Framework security release required:** Next/React baseline versions preceded the current security release. **Fixed** by upgrading Next 16.3.3 and React 19.2.8.
3. **Legacy draft can affect live catalog:** static-token route could publish or modify live products and follow symlinks. **Fixed:** inactive-only, live-update denial, realpath confinement. Product Intake v2 remains preferred.
4. **Root-running services:** public app/worker still run as root. **External deployment blocker:** requires dedicated service users, filesystem ownership plan, and privileged helper separation.
5. **Light-theme repairs contrast/scroll access:** hundreds of failures and non-focusable overflow tables. **Fixed.**
6. **Store shell too narrow:** 80rem editorial shell caused 320px desktop gaps. **Fixed.**
7. **Mobile filter toolbar overlay:** sticky bottom controls covered product content. **Fixed:** controls are in normal flow above the grid.
8. **Unsupported customer claims:** testimonials, “official partner,” blanket warranty, repair counts/speed, payment-method and local-schema claims lacked evidence linkage. **Removed or fail-closed.**
9. **Facet indexing/canonical errors:** filters remained indexable and page 2 canonicalized to page 1. **Fixed.**
10. **Preview/search/research risk:** token preview already noindexed; legacy AI research is now disabled by default and no longer fetches remote search-result images.

### P2 — medium

1. **Order-confirmation UUID/capability exposure:** success URL alone exposed order/customer data and the signed query capability could reach analytics. **Fixed:** the provider return route exchanges the HMAC capability for a 30-minute HttpOnly SameSite cookie, redirects to a clean URL, and analytics strips all payment/order capability parameters.
2. **Chat token/PII exposure:** URL/localStorage token, no expiry, public PII serialization, no operation limits. **Fixed.**
3. **Backup credentials/stateful GET/corrupt success:** database URL appeared in argv, GET spawned work, app backup archived the `current` symlink itself, and subprocess failures could still yield HTTP 200. **Fixed** with POST/origin checks, safe argv/env, mode-600 completed temporary files, checked exit/size before response, symlink dereference, deduplicated uploads, and concurrency guard.
4. **Campaign RBAC:** product editors could manage discounts. **Fixed.**
5. **Cart parser/zero stock:** malformed storage and zero-stock quantities were not rejected/canonicalized early. **Fixed.**
6. **PayPal verification amplification:** arbitrary traffic could trigger provider token/verification calls. **Fixed** with size/header/shape checks, rate limit, trusted cert host validation, and token caching.
7. **Modal focus lifecycle:** filter, quick-add, gallery, and mini-cart did not consistently restore/trap focus. **Fixed.**
8. **Product/ledger/marketplace atomicity:** some admin product writes remain multi-step. **Open; requires transactional outbox redesign.**
9. **Repair-estimate issue/PDF ordering:** committed document state could be followed by PDF deletion when the linked repair-cost update failed. **Fixed:** version issuance and the linked repair update now share one transaction; an uncommitted PDF is deleted only after rollback or an optimistic-lock conflict.
10. **Mail admin passwords in process argv:** **Open; requires tested stdin or privileged helper flow.**
11. **Generic legacy redirects:** `/product/*` and `/urun/*` still redirect many-to-one. **Open pending verified old-slug mapping; not changed to avoid breaking indexed URLs blindly.**
12. **Catalog data review:** visual QA found a possible product image/color-versus-SKU mismatch, stale price embedded in a related-product image, and questionable related accessory compatibility. **External catalog-data blocker; no product data was silently changed.**

### P3 — low/polish

- Footer remains vertically large.
- Product image asset framing/scale varies because source assets differ.
- Category rail intentionally shows a trailing-card peek.
- Desktop prose and some product-detail sections remain long.
- Product-page related-content taxonomy can be improved.
- Public app CSS remains large and selector-heavy despite a net reduction.

## 6. Implemented changes and important files

### Checkout/payment/inventory

- `src/lib/checkout-return-token.ts`
- `src/lib/checkout-reconciliation.ts`
- `src/lib/checkout-stock.ts`
- `src/lib/checkout.ts`
- `src/app/api/checkout/stripe/route.ts`
- `src/app/api/checkout/stripe/intent/route.ts`
- `src/app/api/checkout/paypal/create/route.ts`
- `src/app/api/checkout/return/[locale]/route.ts`
- `src/app/(site)/[lang]/checkout/success/page.tsx`
- `scripts/marketplace-worker.ts`

Key behavior:

- 48-hour signed provider-return capability exchanged server-side for a 30-minute HttpOnly return session before redirecting to a clean success URL.
- Hosted Stripe session expires after one hour.
- Stale worker handles normal/failed unpaid states, validates provider identity/amount/currency, transitions recovered successful payments to paid, protects processing objects, and uses compare-and-set cancellation with a two-pass PayPal fence.
- Cart quantities fail closed on unknown/zero stock.

### Security/privacy

- `src/lib/chat-session.ts`, `src/lib/chat-public.ts`
- `src/app/api/chat/session/route.ts`, `src/app/api/chat/messages/route.ts`
- `src/lib/paypal-webhook-envelope.ts`
- `src/lib/database-backup.ts`
- `src/app/api/admin/health/backup/route.ts`
- `src/lib/map-consent.ts`
- `src/components/ExternalMapEmbed.tsx`
- `src/proxy.ts`
- `next.config.ts`

Key behavior:

- Chat uses HttpOnly SameSite cookie, expires after 30 days, redacts public payload, and is rate-limited.
- Public email/PII forms are rate-limited before body parsing.
- Production reCAPTCHA config failures fail closed.
- CSP, Permissions Policy, COOP, HSTS, nosniff, frame protection, and strict referrer policy are emitted.
- Redirects use configured site origin rather than forwarded host.

### Layout/theme/accessibility

- `src/app/globals.css`
- `src/lib/product-page-layout.ts`
- `src/components/store/StoreCatalogClient.tsx`
- `src/components/store/StoreFilters.tsx`
- `src/components/ThemeProvider.tsx`, `ThemeToggle.tsx`, `LocaleSwitcher.tsx`
- `src/components/ProductGallery.tsx`
- `src/components/checkout/MiniCart.tsx`
- `src/components/RepairCatalogExplorer.tsx`, `RepairPriceTable.tsx`

Key behavior:

- 108rem commerce shell, responsive 1/2/3/4/5-column grid, no overflow masking.
- Theme source and browser chrome are consistent; native controls receive correct color scheme.
- Mobile filter/sort controls are in normal flow and do not overlap products.
- Dialog focus is entered, trapped, and restored.
- Repair tables are labeled keyboard-scroll regions.
- Animated content is visible without JavaScript.

### SEO/data truth/performance

- `src/lib/store-indexing.ts`
- `src/lib/metadata.ts`
- `src/lib/meta-catalog.ts`
- `src/lib/google-merchant.ts`
- `src/lib/schema.ts`
- `src/lib/image.ts`
- `src/lib/products.ts`
- `src/components/store/StoreCollectionLanding.tsx`

Key behavior:

- Page 2 self-canonical; search/filter/sort/view noindex/follow.
- Invalid/unverified Product Offer dates omitted.
- Runtime uploads use Next image optimization.
- Full product loader is request-memoized, eliminating repeated catalog/inventory reads within a render request.
- Commercial FAQ schema removed while visible FAQ stays.

### Dependency/build/deployment

- `package.json`, `package-lock.json`
- `.nvmrc`, `.node-version`, `.dockerignore`
- `.github/workflows/ci.yml`
- `Dockerfile`
- `deployment/vps/scripts/deploy-app.sh`
- `scripts/deploy.sh`

## 7. Dependency changes and rationale

### Upgraded

- Next.js → 16.3.3 (current security release)
- React / React DOM → 19.2.8
- Sharp → 0.35.4 (fixes `GHSA-f88m-g3jw-g9cj` / inherited libvips vulnerabilities)
- Stripe React/JS libraries within current major
- Tailwind/PostCSS plugin within v4
- Nodemailer, pg, simple-icons, tsx, Vitest, React/PG/Nodemailer types within compatible majors
- `eslint-config-next` → 16.3.3
- Direct `@zxing/library` declaration added

### Removed/moved

- Removed unused `gsap` and `dotenv`.
- Moved `@types/pdfkit` to dev dependencies.
- Removed confirmed-unused legacy store/loading/WhatsApp components and unsupported testimonial/partner components.

### Intentionally deferred

- **ESLint 10:** Next’s bundled `eslint-plugin-react`, `eslint-plugin-import`, and `eslint-plugin-jsx-a11y` are not compatible. A real ESLint 10 run failed inside `react/display-name`; latest compatible ESLint 9.39.5 is pinned and `eslint-plugin-react-hooks` 7.0.1 is overridden because 7.1.1 newly enables compiler advisory rules that require a dedicated migration. npm marks ESLint 9 unsupported; this is an explicit external ecosystem blocker, not silently ignored.
- **TypeScript 7:** major migration deferred.
- **PDFKit 0.20:** pre-1.0 minor may be breaking and needs PDF visual/output regression testing.
- **Node types 26:** production runtime remains Node 24 LTS.

Final npm audit: **0 vulnerabilities**.

## 8. Store-width/gap correction

### Root cause

`container-page` used `max-width: 80rem`, while product pages used 108rem. At 1920px the store left 320px outside each side and then another 24px internal padding. The grid remained 952px/four columns.

### Exact correction

- Shared main shell maximum: 108rem / 1728px.
- Grid breakpoints: one column below 360px; two from 360px; three at 768/1024; four at 1280/1440; five at 1920.
- Global `overflow-x-clip` removed.
- Skeleton breakpoints match real cards.
- Mobile filter toolbar moved above products in normal flow.

### Final measured matrix

| Viewport | Columns | First card | Document overflow |
|---:|---:|---:|---|
| 320 | 1 | 272px | No |
| 375 | 2 | 157.5px | No |
| 390 | 2 | 165px | No |
| 768 | 3 | 232px | No |
| 1024 | 3 | 224px | No |
| 1280 | 4 | 229px | No |
| 1440 | 4 | 269px | No |
| 1920 | 5 | ~270.4px | No |

At 1920px the shell is 1728px with 96px intentional outside margins. Final mobile geometry measured the filter/sort bar ending at 692.5px and the first card beginning at 708.5px: 16px separation, no overlap.

## 9. Light/dark theme correction

### Root cause

The server always emitted a theme attribute, so the pre-paint script’s localStorage fallback was unreachable when no theme cookie existed. Browser chrome was always dark, and several components bypassed semantic tokens with fixed white-alpha or Tailwind palette colors.

### Correction

- Added theme source (`cookie` versus fallback/client).
- Cookie remains canonical for SSR; local preference wins only when no cookie exists.
- `theme-color` updates before hydration and on toggle.
- `color-scheme` is theme-aware.
- Stripe Element appearance follows app theme.
- Repair, stock, error, and checkout states use semantic tokens.
- Language/theme segmented controls support arrow keys and roving tab stops.

Verified: light→dark toggle, navigation/reload persistence, dark cookie persistence, no hydration warnings, no console errors, and zero axe violations in both themes.

## 10. Accessibility results

Target: WCAG 2.2 AA technical implementation; no legal certification claim.

Implemented:

- Skip target and visible focus preserved.
- Complete focus lifecycle for consent, mobile filter, quick-add, mini-cart, and gallery.
- Accessible review rating state and review-photo names.
- Disabled pagination leaves tab order.
- Checkout errors are associated with fields; first invalid field receives focus.
- Empty checkout is an actual disabled button.
- Repair tables are focusable labeled regions.
- Motion is no longer required to reveal content; trending autoplay removed.
- Mobile filter toolbar no longer overlays product content.

Final axe result: **32 scans, 0 rule instances, 0 violating nodes** across home/store/product/cart/checkout/repairs/contact/404, 390/1440, light/dark.

Manual/interaction checks passed for focus entry/restoration, Escape, consent, menu, filters, search, cart, checkout entry, and contact native validation. A full human screen-reader session remains recommended before legal certification.

## 11. SEO and structured-data verification

Final rendered checks:

- `/de/store`: index/follow, canonical base, valid CollectionPage/Breadcrumb JSON-LD.
- `/de/store?page=2`: index/follow, self-canonical with `?page=2`.
- Store search/brand facets: noindex/follow, canonical base.
- Product page: canonical product URL, Product/Breadcrumb JSON-LD, no fabricated `priceValidUntil`.
- Price-comparison URL: 200, noindex/follow, evidence-review copy, no Dataset schema.
- `robots.txt`, `sitemap.xml`, Google Merchant XML, and Meta CSV: HTTP 200 with expected content types and product content.
- Root: 308 redirect to `/de`.
- All representative JSON-LD scripts parsed successfully.

Open SEO item: exact legacy old-product URL mappings are required before replacing the current generic many-to-one redirects. Aggregate evidence is insufficient to invent destinations.

## 12. Performance and bundle measurements

### Final exact Lighthouse lab run

| Route/profile | Perf | A11y | Best | SEO | FCP | LCP | TBT | CLS | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Home mobile | 58 | 100 | 100 | 100 | 1.4s | 4.9s | 1,060ms | 0 | 511 KiB |
| Store mobile | 76 | 100 | 100 | 100 | 1.5s | 4.4s | 340ms | 0 | 496 KiB |
| Store desktop | 98 | 100 | 100 | 100 | 0.4s | 1.1s | 30ms | 0.001 | 597 KiB |

Mobile performance did not reach the aspirational 90/LCP 2.5s target. The remaining lab bottleneck is a shared ~73KB Next/React framework/polyfill client chunk with heavy CPU-throttled execution plus global render-blocking CSS. This is not field p75 data. No field INP/LCP dataset was available.

### Major improvement

- Store mobile transfer: 2,384 KiB → 496 KiB.
- Store mobile LCP: 11.4s → 4.4s.
- Store mobile TBT: 740ms → 340ms.
- Store desktop performance: 87 → 98; LCP 2.3s → 1.1s.
- Home mobile transfer: 1,621 KiB → 511 KiB; LCP 9.2s → 4.9s.
- Header logo: ~765KB original → 4,473-byte optimized response at 128w.
- Example 48px product preview: 2,095-byte optimized response.
- Static build assets: JS −51,079 bytes; CSS −9,629 bytes; one fewer asset file.

The final store carousel is static until explicit user interaction; no autoplay or moving-content timer remains.

## 13. Final verification matrix

| Check | Result |
|---|---|
| Clean `npm ci` | Pass |
| `npm audit --audit-level=high` | Pass; 0 vulnerabilities |
| ESLint | Pass; 0 errors/warnings |
| TypeScript | Pass |
| Unit/integration | Pass; 78 files / 378 tests |
| Production build | Pass; 135 generated pages |
| Repository E2E framework | Not added; Playwright audit harness used outside repo |
| Browser route checks | Pass; 27 checks, expected 404 only |
| Browser console/page errors | Pass; no relevant errors |
| Responsive 320–1920 | Pass; no overflow |
| Theme persistence | Pass |
| Mobile menu/filter focus | Pass |
| Search edge cases/XSS probe | Pass |
| Cart add/quantity/remove | Pass |
| Checkout entry | Pass; no payment submitted |
| Contact empty validation | Pass; no request sent |
| Axe | Pass; 32 scans / 0 violations |
| Rendered SEO/schema | Pass for checked routes |
| Security headers | Pass in local production response |
| Added-line secret scan | Pass; 0 findings |
| Lighthouse desktop targets | Pass |
| Lighthouse mobile target | Partial; improved but below 90 |
| Production provider checkout | Not run; requires test-mode dashboard/credentials |
| Production deployment | Not run |

## 14. Important official sources consulted

- Next.js 16 upgrade requirements: https://nextjs.org/docs/app/guides/upgrading/version-16
- Next.js August 2026 security release: https://nextjs.org/blog/august-2026-security-release
- React RSC security advisory: https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components
- Node.js release/LTS policy: https://nodejs.org/en/about/previous-releases
- WCAG 2.2 focus appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
- WCAG 2.2 target size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WCAG quick reference: https://www.w3.org/WAI/WCAG22/quickref/
- Google merchant listing structured data: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- Google Product variants: https://developers.google.com/search/docs/appearance/structured-data/product-variants
- Google ecommerce URL design: https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites
- Stripe webhook signatures: https://docs.stripe.com/webhooks/signature
- Stripe webhook duplicate/replay guidance: https://docs.stripe.com/webhooks
- Bundesfachstelle BFSG ecommerce guidance: https://www.bundesfachstelle-barrierefreiheit.de/DE/Barrierefreiheitsstaerkungsgesetz/E-Commerce/online-shops_node
- EDPB ePrivacy technical scope: https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en

## 15. Visual evidence

Temporary evidence is outside committed source:

- `/tmp/apfel-park-audit/final/visuals/store-390-mono.png`
- `/tmp/apfel-park-audit/final/visuals/store-390-dark.png`
- `/tmp/apfel-park-audit/final/visuals/store-1440-mono.png`
- `/tmp/apfel-park-audit/final/visuals/store-1440-dark.png`
- `/tmp/apfel-park-audit/final/visuals/product-1440-mono.png`
- `/tmp/apfel-park-audit/final/visuals/cart-populated-1440-mono.png`
- `/tmp/apfel-park-audit/final/visuals/checkout-entry-1440-mono.png`
- `/tmp/apfel-park-audit/final/visuals/store-390-toolbar-fixed.png`

The screenshots were captured after consent dismissal and lazy-image loading. Final image probe: 32/32 catalog/trending images loaded; trend `scrollLeft` remained 0 after 7.5 seconds.

## 16. Remaining external actions / blockers

1. **Catalog owner review:** correct or verify product image color versus SKU, stale price baked into a related-product image, related accessory compatibility, product-specific specifications, and exact EPREL identity. No product data/image was silently modified.
2. **Provider test mode:** exercise Stripe hosted, Stripe Payment Element, PayPal create/capture, webhook retries, CSP, cancellation, and paid-versus-expiry race with provider test credentials.
3. **Service least privilege:** migrate app/worker away from root with dedicated users, filesystem ownership, and a narrow privileged helper for backup/mail/system status.
4. **Mail admin:** remove plaintext mailbox passwords from Docker argv using a tested stdin/privileged helper interface and compensate mailbox creation if quota assignment fails.
5. **Atomic admin catalog writes:** product, inventory, featured state, marketplace unpublish, and outbox need one transaction/state machine.
6. **Legacy URL mapping:** export actual old URLs and map only equivalent destinations.
7. **Legal/business review:** validate opening hours, delivery wording, return terms, any guarantee, reference-price basis, partner/testimonial evidence, and BFSG information statement.
8. **ESLint ecosystem:** migrate to ESLint 10 once Next’s bundled plugins support it; current ESLint 9 is compatible but npm marks it unsupported.
9. **Production environment:** add a dedicated `CHECKOUT_RETURN_SECRET` (secure fallback to `APP_SESSION_SECRET` exists) and verify all new flags remain fail-closed.
10. **Deployment approval:** no production switch was made.

## 17. Deployment and rollback notes

- Use only `deployment/vps/scripts/deploy-app.sh`; `scripts/deploy.sh` now delegates to it.
- The canonical workflow deploys a pushed commit through `git archive`, not the dirty source tree.
- Gates now include install, tests, lint, type-check, high-level audit, and build before activation.
- Rollback restarts both web and worker.
- Database changes must remain expand/contract compatible because migrations are forward-only.
- Before deployment, create/verify a PostgreSQL backup and retain the previous release.
- After deployment, verify web, worker, logs, representative routes, payment test mode, feeds, CSP, and image optimizer.

## 18. Readiness statement

**Code quality and local production-readiness gates pass. Production deployment is still blocked on documented external/catalog/privilege/provider actions.**

The source is ready for independent review and a preview/staging deployment. It is not yet approved for production because product-data visual mismatches, provider test-mode payment verification, root service privileges, mail password handling, and legal/business confirmations require external action or operational migration.
