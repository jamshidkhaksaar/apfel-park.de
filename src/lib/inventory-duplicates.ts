// Both inventory endpoints use the same match rule so badge counts and details agree.
export const inventoryDuplicatePredicate = `anchor.id <> candidate.id AND (
  (nullif(lower(btrim(anchor.gtin)), '') IS NOT NULL AND lower(btrim(anchor.gtin)) = lower(btrim(candidate.gtin)))
  OR (nullif(lower(btrim(anchor.sku)), '') IS NOT NULL AND lower(btrim(anchor.sku)) = lower(btrim(candidate.sku)))
  OR (anchor.category = candidate.category
    AND nullif(lower(btrim(anchor.brand)), '') IS NOT NULL
    AND length(btrim(anchor.model)) >= 3
    AND lower(btrim(anchor.brand)) = lower(btrim(candidate.brand))
    AND lower(btrim(anchor.model)) = lower(btrim(candidate.model)))
  OR (anchor.category = candidate.category
    AND length(btrim(anchor.title)) >= 8
    AND lower(btrim(anchor.title)) = lower(btrim(candidate.title)))
)`;

export const inventoryDuplicateReason = `CASE
  WHEN nullif(lower(btrim(anchor.gtin)), '') IS NOT NULL AND lower(btrim(anchor.gtin)) = lower(btrim(candidate.gtin)) THEN 'gtin'
  WHEN nullif(lower(btrim(anchor.sku)), '') IS NOT NULL AND lower(btrim(anchor.sku)) = lower(btrim(candidate.sku)) THEN 'sku'
  WHEN anchor.category = candidate.category AND nullif(lower(btrim(anchor.brand)), '') IS NOT NULL
    AND length(btrim(anchor.model)) >= 3
    AND lower(btrim(anchor.brand)) = lower(btrim(candidate.brand))
    AND lower(btrim(anchor.model)) = lower(btrim(candidate.model)) THEN 'model'
  ELSE 'title'
END`;
