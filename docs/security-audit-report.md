# Security Audit Report

Date: 2026-05-13
Scope: Next.js app, payment APIs, webhooks, tracking endpoints, JSON-LD rendering, dependency audit, admin-sensitive routes.

## Executive Summary

Security hardening was applied to the highest-risk issues found during the Codex security checklist review. The patched items cover payment redirect trust boundaries, PayPal webhook verification, PayPal capture/order matching, JSON-LD script escaping, server-side tracking URL trust, admin CSRF protection, safer app backups, vulnerable direct dependencies, and the Docker runtime base image.

The app now passes lint, production build, service smoke check, and the production QA matrix. `npm audit --omit=dev` still reports a moderate PostCSS advisory bundled inside `next@16.2.6`; `npm view next version` currently returns `16.2.6`, and npm's suggested audit fix would downgrade Next to `9.3.3`, so this remains an upstream residual until a compatible Next release updates bundled PostCSS.

## Fixed Findings

| ID | Severity | Finding | Fix | Verification |
| --- | --- | --- | --- | --- |
| SEC-001 | High | Stripe and PayPal checkout return/cancel URLs trusted the request `Origin` header, allowing hostile origin injection into provider redirects. | Added `getCheckoutBaseUrl()` and switched Stripe/PayPal checkout routes to configured site origin only. | `npm run lint`, `npm run build`, production QA passed. |
| SEC-002 | High | PayPal webhook accepted events without verification when `PAYPAL_WEBHOOK_ID` was missing. | PayPal webhook now fails closed with `503` if verification is not configured and rejects invalid signatures with `400`. | Production QA added PayPal unsigned webhook rejection and passed. |
| SEC-003 | High | PayPal capture marked an order paid after provider `COMPLETED` without checking the captured PayPal purchase unit referenced the same local order. | Capture route now requires `reference_id` or `custom_id` to match the local `orderId` before payment status update. | `npm run build` TypeScript check passed. |
| SEC-004 | Medium | Product and global JSON-LD used raw `JSON.stringify` inside script tags. Product/admin content containing `</script>` could break out of JSON-LD. | Replaced raw JSON serialization with `safeJsonStringify()` for Product, Breadcrumb, Organization, and WebSite JSON-LD. | `rg` confirms JSON-LD uses escaped serializer. |
| SEC-005 | Medium | Contact, repair, and server-side ViewContent tracking events used request `Origin` to construct event URLs. | Tracking event URLs now use configured `siteInfo.url`. | `rg` confirms `request.headers.get("origin")` no longer remains in API routes. |
| SEC-006 | Medium | Direct production dependency audit flagged vulnerable `next@16.1.1` and `nodemailer@8.0.3`. | Upgraded to `next@16.2.6` and `nodemailer@8.0.7`. | Direct Nodemailer advisory cleared; Next high advisories cleared. |
| SEC-007 | Medium | Docker runtime used Node 18 while Next 16 requires Node `>=20.9`. | Updated Dockerfile base to `node:20-alpine`. | Production build on Next 16.2.6 passed. |
| SEC-008 | Medium | Admin POST/PATCH/DELETE routes used cookie auth but did not enforce same-origin mutation requests. | Added shared `rejectCrossSiteAdminMutation()` guard and applied it to admin login, logout, uploads, products, promo, chat, mail, and marketing test mutations. | Production QA confirms cross-site admin login mutation returns `403`. |
| SEC-009 | Medium | Admin app backup included `shared/app.env`, exporting live secrets in the default app backup. | Removed `shared/app.env` from app backup archive contents. | Static check confirms backup route no longer references `shared/app.env`. |

## Key Code References

- Checkout origin hardening: `src/lib/checkout.ts`, `src/app/api/checkout/stripe/route.ts`, `src/app/api/checkout/paypal/create/route.ts`
- PayPal webhook fail-closed verification: `src/app/api/webhooks/paypal/route.ts`
- PayPal capture order matching: `src/app/api/checkout/paypal/capture/route.ts`
- JSON-LD escaping: `src/app/(site)/[lang]/store/[slug]/page.tsx`, `src/app/layout.tsx`
- Server-side tracking URL cleanup: `src/app/api/contact/route.ts`, `src/app/api/repairs/route.ts`, `src/app/api/marketing/view-content/route.ts`
- Admin CSRF guard: `src/lib/admin-csrf.ts`, `src/app/api/admin/*`
- Safer app backups: `src/app/api/admin/health/backup/route.ts`
- Production QA webhook and CSRF coverage: `scripts/production-qa.ts`

## Verification Results

- `npm run lint`: pass
- `npm run build`: pass on Next.js `16.2.6`
- Service restart: `apfel-park-nextjs.service` active
- Smoke check: `http://127.0.0.1:3000/de` returned HTTP 200
- `npm run qa:production`: 20/20 passed
- `npm audit --omit=dev`: 2 moderate residual findings from Next-bundled PostCSS

## Remaining Risks

| ID | Severity | Risk | Recommendation |
| --- | --- | --- | --- |
| RISK-001 | Medium | `npm audit --omit=dev` still flags `next/node_modules/postcss@8.4.31` via Next. The latest published Next version checked during this audit is `16.2.6`; the available npm force fix downgrades Next to `9.3.3`, which is not acceptable. | Track Next releases and upgrade as soon as a compatible release bundles PostCSS `>=8.5.10`. |
| RISK-002 | Low/Medium | Security headers are present, but there is no Content Security Policy. Tracking scripts make CSP rollout more sensitive. | Add CSP in report-only mode first, include GA4/Meta/TikTok/PayPal/Stripe allowances, then enforce after collecting violations. |
| RISK-003 | Low | Next build emits a Turbopack NFT tracing warning through `src/lib/blob.ts` and `next.config.ts`. | Refactor dynamic filesystem path handling or add scoped ignore comments to reduce tracing surface and build noise. |

## Operational Notes

- PayPal webhook handling now requires `PAYPAL_WEBHOOK_ID` when webhooks are enabled.
- Sandbox payment tests still require real Stripe/PayPal sandbox credentials; routes correctly fail closed without them.
- The Codex security skills were installed locally, but Codex should be restarted to load them as first-class skills in future sessions.
