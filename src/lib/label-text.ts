/**
 * Brand and model text for the shop label: the brand prints small above the
 * model, so it is taken off the front of the model name ("Samsung Galaxy S24
 * Ultra 256 GB" → brand "Samsung", model "Galaxy S24 Ultra").
 */

const KNOWN_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Google", "Huawei", "OnePlus", "Nokia", "Motorola",
  "Oppo", "Honor", "Sony", "Lenovo", "Realme", "Nothing", "Fairphone", "Vivo",
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** "SAMSUNG" or "samsung" → "Samsung"; known spellings such as "OnePlus" are kept. */
const displayBrand = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const known = KNOWN_BRANDS.find((brand) => brand.toLowerCase() === trimmed.toLowerCase());
  if (known) return known;
  return trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()
    ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
    : trimmed;
};

export function labelBrandAndModel(rawName: string, storage: string, brandField: string): { brand: string; model: string } {
  const raw = rawName.trim();
  let name = raw;
  let brand = displayBrand(brandField);

  // Take a brand off the front of the name: the product's own brand, else a known one.
  const candidates = [brand, ...KNOWN_BRANDS].filter(Boolean);
  for (const candidate of candidates) {
    const prefix = new RegExp(`^${escapeRegExp(candidate)}\\s+`, "i");
    if (prefix.test(name)) {
      name = name.replace(prefix, "").trim();
      if (!brand) brand = displayBrand(candidate);
      break;
    }
  }
  // An iPhone or iPad is an Apple device even when the brand field is empty.
  if (!brand && /^i(phone|pad)\b/i.test(name)) brand = "Apple";

  // Storage goes on its own line, so drop it from the end of the name.
  if (storage) {
    const pattern = escapeRegExp(storage.trim()).replace(/\s+/g, "\\s*");
    name = name.replace(new RegExp(`\\s*${pattern}\\s*$`, "i"), "").trim();
  }
  name = name.replace(/\s*\d+\s?(GB|TB)\b.*$/i, "").trim();

  return { brand, model: name || raw };
}
