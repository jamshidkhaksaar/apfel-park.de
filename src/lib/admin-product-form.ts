import type { AdminProductRecord, ProductFormState, ProductSpec, ProductVariant } from '@/lib/admin-product-types';

export const productToForm = (product: AdminProductRecord): ProductFormState => ({
  id: product.id,
  title: product.title,
  subtitle: product.subtitle,
  description: product.description,
  category: product.category,
  condition: product.condition || "new",
  batteryHealth: product.batteryHealth ? String(product.batteryHealth) : "",
  hasRealProductPhotos: Boolean(product.hasRealProductPhotos),
  conditionNote: product.conditionNote || "",
  brand: product.brand,
  model: product.model,
  sku: product.sku,
  mpn: product.mpn ?? "",
  gtin: product.gtin ?? "",
  manufacturerName: product.manufacturer?.name ?? "",
  manufacturerAddress: product.manufacturer?.address ?? "",
  manufacturerEmail: product.manufacturer?.email ?? "",
  euResponsibleName: product.euResponsiblePerson?.name ?? "",
  euResponsibleAddress: product.euResponsiblePerson?.address ?? "",
  euResponsibleEmail: product.euResponsiblePerson?.email ?? "",
  safetyWarningsText: (product.safetyWarnings ?? []).join("\n"),
  safetyDocumentsText: (product.safetyDocuments ?? []).join("\n"),
  faqDeText: (product.faq?.de ?? []).map((entry) => `${entry.q}\n${entry.a}`).join("\n\n"),
  faqEnText: (product.faq?.en ?? []).map((entry) => `${entry.q}\n${entry.a}`).join("\n\n"),
  eprelId: product.eprelId ?? "",
  energyEfficiencyClass: product.energyLabel?.efficiencyClass ?? "",
  energyBatteryEndurance: product.energyLabel?.batteryEndurance ?? "",
  energyBatteryCycles: product.energyLabel?.batteryCycles != null ? String(product.energyLabel.batteryCycles) : "",
  energyReliabilityClass: product.energyLabel?.reliabilityClass ?? "",
  energyRepairabilityClass: product.energyLabel?.repairabilityClass ?? "",
  energyIpRating: product.energyLabel?.ipRating ?? "",
  energyLabelImage: product.energyLabel?.labelImage ?? "",
  energyFicheDe: product.energyLabel?.ficheDe ?? "",
  energyFicheEn: product.energyLabel?.ficheEn ?? "",
  price: String(product.price),
  compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
  stock: String(product.stock),
  isActive: product.isActive,
  images: product.images,
  variants: product.variants,
  isHomepageFeatured: Boolean(product.isHomepageFeatured),
  featureBulletsText: product.featureBullets.join("\n"),
  // Serialise grouped specs back to the textarea format: "## Group" heading
  // lines before the rows that belong to that group.
  specsText: product.specs
    .map((item, index, all) => {
      const groupChanged = item.group && (index === 0 || all[index - 1]?.group !== item.group);
      const line = `${item.label}: ${item.value}`;
      return groupChanged ? `## ${item.group}\n${line}` : line;
    })
    .join("\n"),
  channelFields: {
    identifierStatus: product.identifierStatus ?? "unknown",
    asin: product.asin ?? "",
    ebayEpid: product.ebayEpid ?? "",
    countryOfOrigin: product.countryOfOrigin ?? "",
    packageWeightKg: product.packageWeightKg != null ? String(product.packageWeightKg) : "",
    packageLengthCm: product.packageLengthCm != null ? String(product.packageLengthCm) : "",
    packageWidthCm: product.packageWidthCm != null ? String(product.packageWidthCm) : "",
    packageHeightCm: product.packageHeightCm != null ? String(product.packageHeightCm) : "",
    batteryIncluded: product.batteryDetails?.included == null ? "" : product.batteryDetails.included ? "yes" : "no",
    batteryCellComposition: product.batteryDetails?.cellComposition ?? "",
    batteryCount: product.batteryDetails?.count != null ? String(product.batteryDetails.count) : "",
    batteryWeightGrams: product.batteryDetails?.weightGrams != null ? String(product.batteryDetails.weightGrams) : "",
    batteryWattHours: product.batteryDetails?.wattHours != null ? String(product.batteryDetails.wattHours) : "",
    batteryUnNumber: product.batteryDetails?.unNumber ?? "",
    chargerIncluded: product.chargerIncluded == null ? "" : product.chargerIncluded ? "yes" : "no",
    chargingPowerMinW: product.chargingPowerMinW != null ? String(product.chargingPowerMinW) : "",
    chargingPowerMaxW: product.chargingPowerMaxW != null ? String(product.chargingPowerMaxW) : "",
    usbPdSupported: product.usbPdSupported == null ? "" : product.usbPdSupported ? "yes" : "no",
    googleProductCategory: product.marketplaceCategoryMappings?.google?.category ?? "",
    ebayCategoryId: product.marketplaceCategoryMappings?.ebay_de?.categoryId ?? "",
    ebayCategoryName: product.marketplaceCategoryMappings?.ebay_de?.categoryName ?? "",
    ebayRequiredAspects: product.marketplaceCategoryMappings?.ebay_de?.requiredAspects ?? [],
    ebayAspects: product.marketplaceAttributes?.ebay_de ?? {},
    amazonProductType: product.marketplaceCategoryMappings?.amazon_de?.productType ?? "",
    amazonGtinExemption: Boolean(product.amazonGtinExemption),
    amazonRenewedApproved: Boolean(product.amazonRenewedApproved),
  },
});

export const parseFeatureBullets = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export const parseSpecs = (value: string) => {
  let group = "";
  const specs: ProductSpec[] = [];
  for (const rawLine of value.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    // "## Display" starts a new spec group; it applies to every following row.
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      group = heading[1]?.trim() ?? "";
      continue;
    }
    const match = line.match(/^(.+?)(?:\s*[:=]\s*|\s+[–-]\s+|\t+)(.+)$/);
    if (!match) continue;

    const label = match[1]?.trim() ?? "";
    const specValue = match[2]?.trim() ?? "";
    if (!label || !specValue) continue;

    specs.push({ label, value: specValue, ...(group ? { group } : {}) });
  }
  return specs;
};

export const parseFaqText = (text: string): Array<{ q: string; a: string }> =>
  text
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2) return null;
      return { q: lines[0], a: lines.slice(1).join("\n") };
    })
    .filter((entry): entry is { q: string; a: string } => entry !== null)
    .slice(0, 10);

export const createEmptyVariant = (): ProductVariant => ({
  color: "",
  storage: "",
  price: undefined,
  compareAtPrice: undefined,
  stock: undefined,
  sku: "",
  mpn: "",
  gtin: "",
  identifierStatus: "unknown",
  asin: "",
  ebayEpid: "",
  imageIndex: undefined,
  isDefault: false,
});
