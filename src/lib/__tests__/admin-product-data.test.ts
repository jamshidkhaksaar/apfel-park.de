import { describe, expect, it } from "vitest";

import { mapAdminProduct, type ProductRow } from "../admin-product-data";

describe("mapAdminProduct", () => {
  it("preserves official EPREL label and datasheet asset routes", () => {
    const row = {
      id: "product-1",
      title: "Phone",
      subtitle: null,
      description: null,
      category: "smartphones",
      condition: "new",
      battery_health: null,
      has_real_product_photos: false,
      condition_note: null,
      brand: "Example",
      model: "Model 1",
      sku: "SKU-1",
      price: 799,
      compare_at_price: null,
      stock: 1,
      slug: "phone",
      is_active: true,
      images: [],
      feature_bullets: [],
      specs: [],
      variants: [],
      created_at: "2026-08-19T00:00:00.000Z",
      energy_label: {
        efficiencyClass: "A",
        batteryEndurance: "41 h 0 min",
        batteryCycles: 1000,
        reliabilityClass: "B",
        repairabilityClass: "C",
        ipRating: "IP68",
        labelImage: "/energy-labels/Label_2402623.png",
        ficheDe: "/energy-labels/Fiche_2402623_DE.pdf",
        ficheEn: "/energy-labels/Fiche_2402623_EN.pdf",
      },
    } as ProductRow;

    expect(mapAdminProduct(row).energyLabel).toMatchObject({
      labelImage: "/energy-labels/Label_2402623.png",
      ficheDe: "/energy-labels/Fiche_2402623_DE.pdf",
      ficheEn: "/energy-labels/Fiche_2402623_EN.pdf",
    });
  });
});
