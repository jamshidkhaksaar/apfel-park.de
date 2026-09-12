# Smartphone editor rollout

The opt-in editor groups stock around a phone model. New color/storage combinations are separate product records; open-box and used phones are individual devices. Existing multi-variant products retain their IDs, URLs, variants, and inventory ledger rows.

## Enablement

1. Apply `supabase/migrations/20260907_smartphone_editor_drafts.sql` with the normal migration process and a role allowed to alter `product_families`. It is additive and does not change any existing listing or regroup inventory. The application role gets access only to the new server-side draft tables.
2. Deploy the tested release with `SMARTPHONE_EDITOR_ENABLED=false` initially. Existing create/edit pages remain available. The legacy photo-slot correction and Google feed eligibility check also ship with this release.
3. Set `SMARTPHONE_EDITOR_ENABLED=true` and restart the application using the existing deployment procedure. `/admin/products/new` opens the wizard; smartphone edit pages use the same workspace. `/admin/products/phone?draft=<id>` resumes a server draft. Other product categories and advanced catalog/presentation settings remain linked to the legacy forms.
4. Pilot with one model and a small selected set of entries. Review prices, stock, galleries, and each channel's actual status before wider use.

The flag is server-only and defaults off. Disabling it returns staff to the previous editor and hides draft APIs. Leave the additive tables and uploaded files intact; existing published products remain available. Do not reverse the migration to roll back the UI.

## Draft and publication semantics

- Drafts contain shared information, pending shared edits awaiting acceptance, stable entry and photo-slot IDs, channel selections, and a revision number. Draft saves never mutate products.
- Concurrent saves return HTTP 409. Publication also checks the original product and inventory snapshots, so an intervening sale/reservation or live edit cannot be silently overwritten. Start a fresh revision from the product to incorporate live changes.
- Publication requires four different decoded uploaded images per entry. Re-uploading the same image under another filename does not satisfy the requirement. Explicit same-color reuse is available only for new phones; individual-device evidence cannot be reused for another device.
- Product writes, family links, stock ledger updates, marketplace queue entries, and the idempotency receipt commit together. Reusing a publication request ID returns the original result; reusing it with different input is rejected.
- Select all variants when publishing a legacy multi-variant record. Existing non-variant products stay non-variant. Existing reservations and safety buffers are retained when staff edit the available quantity.
- Shared changes list affected entries and require application. AI model suggestions, when the existing `LEGACY_PRODUCT_RESEARCH_ENABLED` facility is enabled, appear as a pending proposal and need the same explicit acceptance. No AI key or service is enabled by this feature.
- Website readiness is independent of Google, eBay, and Amazon. Google-incomplete or explicitly unselected entries are excluded from both Google feeds. Google “Pending” is not an assertion of acceptance by Merchant Center.
- Marketplace publication retains existing owner approval, compliance, enabled-connection, and price-rule requirements. External publication is asynchronous; the wizard reads worker listing results to distinguish pending, published, and failed. No marketplace credentials are changed.

## Verification

- `npm test -- --maxWorkers=2`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Database acceptance tests: set `PHONE_EDITOR_INTEGRATION=1`, `DATABASE_URL` to a disposable database named **apfel_phone_test**, and `UPLOADS_DIR` to a disposable upload folder; run `npm test -- src/lib/smartphone-editor/repository.integration.test.ts`. Never point these fixtures at production.
- Browser acceptance: create a model; add stocked versions; upload/replace/remove/reorder photos; choose a cover; simulate an upload failure and retry; refresh and resume; publish website-ready entries with incomplete marketplaces; inspect separate used-device cards on the storefront. Check German/English, desktop/mobile, keyboard controls, and dark/mono themes.

No production migration, flag change, external marketplace publication, or deployment was performed during implementation. Browser and database checks used local synthetic records and uploads.
