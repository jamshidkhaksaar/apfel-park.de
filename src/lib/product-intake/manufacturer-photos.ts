/** Reuse locally stored, hash-checked licensed WebP assets. No search scraping,
 * hardcoded colour, browser transcode or duplicate upload loses their provenance.
 */
export const getLicensedManufacturerImages = async (brand: string, model: string, color: string): Promise<string[]> => {
  if (!brand || !model || !color) return [];
  try {
    const params = new URLSearchParams({ brand, model, color, condition: 'new' });
    const response = await fetch(`/api/admin/products/research/assets?${params}`, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!response.ok) return [];
    const payload = await response.json() as { images?: unknown };
    return Array.isArray(payload.images) ? payload.images.filter((url): url is string => typeof url === 'string' && /^\/uploads\/products\/[a-z0-9_.-]+\.webp$/i.test(url)).slice(0, 4) : [];
  } catch { return []; }
};
