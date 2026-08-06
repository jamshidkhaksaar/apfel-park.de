import type { ProductSpec } from "@/lib/products";

/**
 * Client-safe spec grouping. This lives in its own module because
 * src/lib/products.ts pulls in the pg database client, and importing a value
 * from it into a client component would drag Node built-ins into the bundle.
 */

/**
 * Groups specs for rendering, preserving insertion order. Specs without a
 * group land in a single unlabelled block (key ""), so legacy data renders
 * exactly as before.
 */
export const groupSpecs = (specs: ProductSpec[]): Array<{ group: string; items: ProductSpec[] }> => {
  const groups: Array<{ group: string; items: ProductSpec[] }> = [];
  for (const spec of specs) {
    const key = spec.group?.trim() ?? "";
    const existing = groups.find((entry) => entry.group === key);
    if (existing) existing.items.push(spec);
    else groups.push({ group: key, items: [spec] });
  }
  return groups;
};
