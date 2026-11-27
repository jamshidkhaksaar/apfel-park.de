import { findModelCatalogCandidates } from '@/lib/catalog-offer-resolution';
import { query, withTransaction } from '@/lib/db';
import { applyVerifiedEuComplianceFallback } from '@/lib/eu-compliance-registry';
import { buildAutoProductExperience } from '@/lib/product-experience-autofill';
import type { ProductResearchResult } from '@/lib/product-research-core';
import { resolveVerifiedResearchPhotos } from '@/lib/product-research-photos';
import type { ProductCondition } from '@/lib/products';

const loadComparisonIds = async (
  category: string,
  brand?: string,
  model?: string,
): Promise<string[]> => {
  if (!process.env.DATABASE_URL) return [];
  try {
    const rows = (
      await query(
        `SELECT id, brand, model
           FROM products
          WHERE is_active = true
            AND category = $1
            AND lower(coalesce(model, title)) <> lower(coalesce($3, ''))
          ORDER BY (lower(coalesce(brand, '')) = lower(coalesce($2, ''))) DESC, updated_at DESC
          LIMIT 6`,
        [category || 'smartphones', brand ?? '', model ?? ''],
      )
    ).rows as Array<{ id: string }>;
    return rows.map(r => r.id).slice(0, 2);
  } catch {
    return [];
  }
};

/**
 * Shared enrichment helper for both Admin AI Research and Telegram Worker:
 * fills verified EU GPSR/charging/battery facts, exact product photos (up to 4),
 * and intelligent Product Presentation configuration.
 */
export const enrichResearchedProduct = async (
  research: ProductResearchResult,
  options: {
    condition?: string;
    color?: string;
    licensedGallery?: string[];
    includePhotos?: boolean;
    preserveEmptyPackageContentsForUsed?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<ProductResearchResult> => {
  const condition: ProductCondition =
    options.condition === 'open_box' || options.condition === 'used' ? options.condition : 'new';
  const category = research.category || 'smartphones';
  const brand = research.brand ?? '';
  const model = research.model ?? '';

  let sibling: {
    manufacturer?: { name?: string; address?: string; email?: string } | null;
    euResponsiblePerson?: { name?: string; address?: string; email?: string } | null;
    chargerIncluded?: boolean | null;
    chargingPowerMinW?: number | null;
    chargingPowerMaxW?: number | null;
    usbPdSupported?: boolean | null;
    batteryDetails?: ProductResearchResult['batteryDetails'] | null;
  } | null = null;

  if (process.env.DATABASE_URL && brand && model) {
    try {
      const candidates = await withTransaction(client => findModelCatalogCandidates(client, {
        category,
        brand,
        model,
        title: research.title,
      }));
      const hit = candidates.find(c => c.euResponsiblePerson || c.manufacturer) ?? candidates[0];
      if (hit) {
        sibling = {
          manufacturer: (hit.manufacturer as typeof hit.manufacturer & { name?: string }) ?? null,
          euResponsiblePerson: (hit.euResponsiblePerson as typeof hit.euResponsiblePerson & { name?: string }) ?? null,
          chargerIncluded: hit.chargerIncluded,
          chargingPowerMinW: hit.chargingPowerMinW,
          chargingPowerMaxW: hit.chargingPowerMaxW,
          usbPdSupported: hit.usbPdSupported,
          batteryDetails: (hit.batteryDetails as ProductResearchResult['batteryDetails']) ?? null,
        };
      }
    } catch {
      // Offline / unit-test mode without DB continues cleanly.
    }
  }

  const enriched = applyVerifiedEuComplianceFallback(research, { condition, sibling });

  const licensed = options.licensedGallery ?? [];
  let verified: string[] = [];
  if (options.includePhotos !== false && brand && model) {
    verified = await resolveVerifiedResearchPhotos({
      brand,
      model,
      color: options.color,
      condition,
      maxPhotos: 4,
      signal: options.signal,
    }).catch(() => []);
  }
  enriched.gallery = Array.from(new Set([...verified, ...licensed])).slice(0, 4);

  const comparisonProductIds = await loadComparisonIds(category, brand, model);
  enriched.experienceSuggestion = buildAutoProductExperience({
    category,
    brand,
    model,
    title: enriched.title,
    condition,
    specs: enriched.specs,
    dimensions: enriched.dimensions,
    packageContents: enriched.packageContents,
    chargerIncluded: enriched.chargerIncluded,
    chargingPowerMaxW: enriched.chargingPowerMaxW,
    usbPdSupported: enriched.usbPdSupported,
    batteryDetails: enriched.batteryDetails,
    campaign: enriched.campaignSuggestion,
    comparisonProductIds,
    preserveEmptyPackageContentsForUsed: options.preserveEmptyPackageContentsForUsed,
  });

  return enriched;
};
