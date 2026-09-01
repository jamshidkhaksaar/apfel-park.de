# Deferred Work

## 2026-09-01 — Ahrefs SEO cleanup review

- Audit condition semantics so `open_box`, `used`, and `refurbished` are never merged or mislabeled in collection logic.
- Verify variant stock always defers to the authoritative `inventory_skus` ledger when variant SKUs are incomplete.
- Replace related-product filtering on legacy `products.stock` with ledger availability.
- Normalize singular/plural category aliases in subcategory counts and related-product queries.
- Prevent transient product-query failures from publishing a truncated sitemap or temporary noindex metadata.
- Consider inventory-ledger timestamps when generating sitemap `lastModified` values.
- Plan a lightweight SQL-backed catalog projection before active inventory grows beyond the current small catalog.
