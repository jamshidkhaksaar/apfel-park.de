---
title: 'Resolve verified Ahrefs crawl defects'
type: 'bugfix'
created: '2026-08-31'
status: 'done'
baseline_commit: '291de78'
context:
  - 'CLAUDE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ahrefs reports a crawler-visible 404 created by Cloudflare email obfuscation on ten localized product pages, two noindex repair-comparison pages in the XML sitemap, and presentation-only catalog query URLs that remain indexable. Its speed, title-length, redirect, and internal-link notices also need evidence-based triage rather than indiscriminate changes.

**Approach:** Reuse the existing hydration-safe email component for GPSR contacts, conditionally exclude unpublished comparison pages from the sitemap, and noindex non-pagination catalog parameters while keeping clean pagination crawlable. Benchmark origin and public response time and preserve ranking copy or inventory freshness when the evidence does not justify a change.

## Boundaries & Constraints

**Always:** Preserve product URLs, bilingual output, visible GPSR contact details, `mailto:` behavior after hydration, live ledger inventory, checkout behavior, sitemap hreflang, and indexable clean pagination. Add regression tests for each changed policy and use the commit-addressed atomic VPS deployment.

**Ask First:** Changing Cloudflare account settings, publishing the repair comparison, caching inventory-bearing HTML across requests, or changing titles on pages already receiving meaningful search traffic.

**Never:** Hide required manufacturer information, index filtered/search/view URLs, add unpublished/noindex URLs to the sitemap, stale stock for performance scores, buy backlinks, mass-redirect valid pages, or change Merchant/marketplace feeds.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| GPSR email | Product has manufacturer or EU email | SSR shows readable non-email fallback; hydrated UI exposes working mail link; Cloudflare creates no `/cdn-cgi/` link | Missing email renders nothing |
| Unpublished comparison | Benchmark evidence gate is false | DE/EN pages remain `noindex,follow` and are absent from sitemap | Published state restores both sitemap entries |
| Presentation query | `?view=list`, search, filter, or sort exists | `noindex,follow`, canonical base collection | Empty values do not change policy |
| Pagination | Valid `?page=2` only | Remains crawlable/indexable | Malformed pagination is noindexed where supported |
| Performance | Warm origin is fast but public crawl varies | Do not add cross-request catalog caching | Record measurements and retain live inventory |

</frozen-after-approval>

## Code Map

- `src/components/ProductDetailExperience.tsx` -- renders manufacturer and EU GPSR email fields.
- `src/components/SafeEmailLink.tsx` -- existing client-hydrated, crawler-safe email behavior.
- `src/lib/seo.ts` -- builds sitemap entries.
- `src/lib/repair-price-benchmark.ts` -- authoritative publication gate.
- `src/lib/store-indexing.ts` -- shared query classification and canonical-page policy.
- `src/lib/products.ts` -- product reads and request-scoped inventory hydration.
- `src/components/SiteFooter.tsx` -- sitewide entry point to the existing A–Z catalog hub.
- `src/lib/__tests__/metadata.test.ts` and new focused tests -- indexing and rendering regressions.

## Tasks & Acceptance

**Execution:**
- [x] `src/components/ProductDetailExperience.tsx` -- render both GPSR emails with `SafeEmailLink`.
- [x] `src/lib/seo.ts` -- include repair-comparison sitemap entries only when the publication gate is true.
- [x] `src/lib/store-indexing.ts` and collection metadata routes -- apply one query policy across all catalog pages: clean pagination self-canonical, presentation/filter/search URLs noindex, and `page=N&view=list` canonicalized to clean `page=N`.
- [x] Catalog structured data -- align CollectionPage and breadcrumb URLs with each page's resolved canonical.
- [x] `src/lib/products.ts` -- request-memoize duplicate product-by-slug reads without cross-request caching or stale inventory.
- [x] `src/components/SiteFooter.tsx` -- add a localized link to the existing A–Z catalog hub to reduce product click depth.
- [x] `src/lib/__tests__/` -- test GPSR email SSR, sitemap gating, query classification, canonical/structured-data alignment, and request deduplication.
- [x] Performance and titles -- retain ranking titles and avoid CDN/ISR catalog caching unless fresh measurements prove a code bottleneck; shorten only non-ranking duplicate titles supported by the audit.

**Acceptance Criteria:**
- Given the live iPhone Air page, when its server HTML is fetched through Cloudflare, then it contains no `/cdn-cgi/l/email-protection` link.
- Given the benchmark is unpublished, when `/sitemap.xml` is generated, then neither localized comparison URL appears.
- Given a collection URL with `view=list`, when metadata is generated, then it is `noindex,follow`; clean page-only pagination stays indexable and self-canonical across metadata and structured data.
- Given metadata and page rendering request the same product slug, when the route is rendered, then only one request-scoped product lookup runs and current ledger stock remains uncached across requests.
- Given deployment, when the full release gate runs, then tests, lint, typecheck, audit, build, service health, robots, sitemap, product email, and store smoke checks pass.

## Spec Change Log

## Design Notes

React request memoization already protects duplicate catalog reads, while ledger stock must remain transactional. Origin TTFB is currently about 26–107 ms warm; public latency is mostly network/CDN variance, so cross-request HTML caching is not justified by this audit alone.

## Verification

**Commands:**
- `npm test` -- all unit/component tests pass.
- `npm run lint && npm run typecheck && npm run build` -- no static or build regressions.
- `./scripts/deploy.sh origin/agent/ahrefs-seo-fixes` -- atomic production activation succeeds.
- Live crawl checks -- zero broken internal targets, zero noindex sitemap entries, and eight trending cards remain.

## Suggested Review Order

**Indexing and canonical policy**

- Central policy preserves pagination while noindexing presentation and filter queries.
  [`store-indexing.ts:14`](apfel-source-ahrefs-code/src/lib/store-indexing.ts#L14)

- Shared collection rendering enforces canonical schema and rejects out-of-range pages.
  [`StoreCollectionLanding.tsx:20`](apfel-source-ahrefs-code/src/components/store/StoreCollectionLanding.tsx#L20)

- Unpublished repair comparisons are excluded from the sitemap by the evidence gate.
  [`seo.ts:270`](apfel-source-ahrefs-code/src/lib/seo.ts#L270)

**Crawler-safe commerce data**

- GPSR contacts remain readable server-side and become validated email links after hydration.
  [`ProductGpsrContacts.tsx:6`](apfel-source-ahrefs-code/src/components/ProductGpsrContacts.tsx#L6)

- Product lookup deduplicates within one render while throwing transient database failures.
  [`products.ts:1217`](apfel-source-ahrefs-code/src/lib/products.ts#L1217)

**Internal discovery**

- Footer links expose the existing localized A–Z catalog without adding random product links.
  [`SiteFooter.tsx:117`](apfel-source-ahrefs-code/src/components/SiteFooter.tsx#L117)

**Regression coverage**

- Query, malformed pagination, canonical, and out-of-range boundaries are explicitly tested.
  [`store-indexing.test.ts:9`](apfel-source-ahrefs-code/src/lib/__tests__/store-indexing.test.ts#L9)

- Sitemap publication follows the repair-comparison evidence state in both locales.
  [`seo-sitemap.test.ts:18`](apfel-source-ahrefs-code/src/lib/__tests__/seo-sitemap.test.ts#L18)

- Client hydration coverage confirms `mailto:` behavior without exposing raw SSR addresses.
  [`SafeEmailLink.client.test.ts:19`](apfel-source-ahrefs-code/src/components/__tests__/SafeEmailLink.client.test.ts#L19)
