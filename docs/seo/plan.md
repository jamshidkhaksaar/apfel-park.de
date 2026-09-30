# Audit remediation plan — 2026-09-30

Baseline live release: e44a04a5eec2dc6dab8088d53b34d841c48396d8; isolated branch seo/audit-20260930. The current release remains immutable.

## Evidence and scope

Audit 1cee2dd2-5f44-4325-8148-d236c3188f62: all 525 rows persisted in audit-before.json and reconciled: 22 duplicate-title rows in six locale/model groups; 36 long descriptions; seven long titles; 20 broken email links and one obfuscation endpoint; 220 noindex, 218 canonicalized and one deep filtered URL.

Intentional filtered-query canonical/noindex and cart/checkout protections are not defects and will remain. No catalog, price, stock, payments, checkout, image-source or database changes are planned.

## Implementation sequence

1. Fetch and persist rendered public metadata for every actionable source URL. Trace registered-route defaults and stored admin settings before changing effective copy.
2. RED/GREEN: reproduce identical product titles; distinguish actual offers with verified attributes and a stable item identity where necessary. Keep titles under the rendered 60-character budget and preserve meaningful model/condition information.
3. RED/GREEN: reproduce length findings at shared metadata resolution. Rewrite the specific route copy, reserving budget for pagination and the root brand. Preserve the existing post-resolution pagination suffix and query policies.
4. Verify Cloudflare's documented markup-local email exemption. RED/GREEN: protect the affected public email links with documented email_off comments, without changing Cloudflare configuration or creating fake redirects. Preserve labels, subjects and mailto functionality.
5. Run targeted/full tests, lint, strict typecheck, unused-source audit and production build. Review the exact scoped diff independently before commit/push.
6. Verify live SHA remains the baseline; push exact scoped commit and deploy through its committed deployment/vps/scripts/deploy-app.sh with the full SHA. Its own concurrency/runtime/rollback gates remain in force.
7. Read back exact release/SHA and service state; verify every affected URL, root/locales/catalog, clean pagination, filtered queries, checkout, known/history/missing product paths and emitted public assets. Persist URL-level evidence.
8. Run a follow-up OpenSEO crawl with maxPages=1000 and runLighthouse=false. Poll no faster than 90 seconds; persist all issue rows and reconcile counts, explicitly distinguishing intentional information from remaining actionable findings.

## Acceptance

No audited duplicate product titles or overlength snippets, no obfuscation endpoint in affected public HTML; public email links remain usable. Commerce and index/canonical policies unchanged. Exact pushed/deployed SHA and verification artifacts are recorded. No indexing/ranking or whole-web performance claims.
