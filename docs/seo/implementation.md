# Implementation and predeploy evidence

- Baseline: immutable live e44a04a5eec2dc6dab8088d53b34d841c48396d8, release 20260929T111942Z-e44a04a5. Worktree /root/apfel-seo-20260930, branch seo/audit-20260930.
- All 525 audit rows saved and counted programmatically. 82 actionable source URLs are listed in affected-urls.json. Before-crawl rows are retained locally in audit-before.json; public before-fetches in live-before.json (82 successful HTTP responses).
- Read-only PostgreSQL inspection found no seo_settings row: registered-route defaults are the effective source. No database writes or migrations introduced.
- Product titles now use actual single-valued offer storage/color or existing stable item references when attributes are absent/over budget. Values come from product variants/specs, never image filenames/slugs. Model names and actual condition are preserved when they fit. Stock/price/catalog remain untouched.
- Specific business/parts/contract-free/used/Wilhelmsburg copy rewritten, not blindly sliced. Collection defaults kept synchronized. Existing shared metadata pagination, administrator override ownership and filter canonical/noindex policies remain unchanged.
- Cloudflare documentation confirms email_off comment pairs as a markup-local exemption; data-cfasync is not an email exemption. Fixed comment markers enclose whole anchors or email-containing legal text; React continues escaping content. No global Cloudflare configuration or redirect changes.
- TDD: product duplicates reproduced as only 3 distinct titles for 11 actual offers per locale; route tests reproduced 61-character title and 174-character description; showcase test reproduced unprotected mailto markup. Additional fallback-budget test reproduced a 61-character rendered title and was fixed. All targeted tests now pass.
- Full test/lint/typecheck/unused/build gates passed. Independent Codex review passed twice; final review has empty security_concerns and logic_errors. Added-line secret/injection/eval/deserialization scan found no matches.

## Evidence artifacts (local, deliberately not deployed)

/root/.hermes/cache/scratch/apfel-product-red.log
/root/.hermes/cache/scratch/apfel-route-red.log
/root/.hermes/cache/scratch/apfel-email-red.log
/root/.hermes/cache/scratch/apfel-budget-red.log
/root/.hermes/cache/scratch/apfel-targeted-green.log
/root/.hermes/cache/scratch/apfel-full-test.log
/root/.hermes/cache/scratch/apfel-lint.log
/root/.hermes/cache/scratch/apfel-typecheck.log
/root/.hermes/cache/scratch/apfel-unused.log
/root/.hermes/cache/scratch/apfel-build.log
/root/.hermes/cache/scratch/apfel-review-final.json

Postdeploy public readback and follow-up crawl results will be retained in the same worktree and scratch directory. No indexing or ranking claim is made.
