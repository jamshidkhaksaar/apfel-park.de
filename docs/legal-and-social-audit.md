# Legal And Social Audit

Date: 2026-05-13

## Social Links

Configured defaults:

- Instagram: `https://www.instagram.com/apfelpark_harburg/`
- Facebook: `https://www.facebook.com/apfelpark.harburg`
- TikTok: `https://www.tiktok.com/@apfelpark`
- WhatsApp: `https://wa.me/494058978787`

Status:

- Links are centralized in `src/lib/site.ts` and can be overridden through `store_settings.site_social_links`.
- Footer social clicks are now tracked through the consent-aware event layer.
- Manual browser verification is still required against the live public profiles.

## Legal Review Flags

Do not enable live checkout until the following have been confirmed by the business owner or a qualified German/EU compliance reviewer:

- Exact legal entity / owner name for the Impressum.
- Whether `Apfel Park` is a registered business name or display name only.
- Refund and withdrawal policy wording for online purchases.
- Shipping policy: carrier, timing, regions, delivery risk transfer, failed delivery handling.
- VAT and invoice wording for consumer prices and order confirmations.
- Payment provider disclosures for Stripe and PayPal.
- Warranty/returns distinction for new, used, refurbished, and repair services.
- Cookie/tracking disclosure once GA4, Meta Pixel/CAPI, and TikTok Pixel/Events API IDs are active.

## Current Implementation Notes

- Prices are presented VAT-inclusive.
- Checkout records VAT amount, VAT rate, shipping method, payment provider, provider references, and paid timestamp.
- Purchase tracking is intended to fire only after verified provider confirmation.
- Legal pages currently contain general site copy and should not be treated as final legal advice.

