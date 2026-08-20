export const wizardSteps = ["device", "facts", "listing", "review"] as const;
export type WizardStep = (typeof wizardSteps)[number];

export type WizardCondition = "new" | "open_box" | "used";

export const catalogConditionFromWizard = (condition: WizardCondition): WizardCondition => condition;

export const extraGalleryImages = (images: string[], cover?: string | null): string[] =>
  images.filter((url) => Boolean(url) && url !== cover);

export const mergeCoverAndGallery = (cover: string, existing: string[]): string[] => {
  const extras = extraGalleryImages(existing, cover);
  return [cover, ...extras].slice(0, 8);
};

export const findCatalogTemplate = <T extends { id: string; brand?: string | null; model?: string | null }>(
  products: T[],
  brand: string,
  model: string,
  excludeId?: string,
): T | null => {
  const brandKey = brand.trim().toLowerCase();
  const modelKey = model.trim().toLowerCase();
  if (!brandKey || !modelKey) return null;
  return products.find((product) =>
    product.id !== excludeId
    && (product.brand ?? "").trim().toLowerCase() === brandKey
    && (product.model ?? "").trim().toLowerCase() === modelKey,
  ) ?? null;
};
