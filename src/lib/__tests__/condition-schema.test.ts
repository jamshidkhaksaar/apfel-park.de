import { describe, expect, it } from "vitest";

import { conditionLabels } from "@/lib/condition-labels";
import { offerDeliveryMethods, schemaAvailability, schemaItemCondition } from "@/lib/schema";

describe("condition tiers", () => {
  it("maps sealed and open box to NewCondition, grade A+ to UsedCondition", () => {
    expect(schemaItemCondition("new")).toBe("https://schema.org/NewCondition");
    expect(schemaItemCondition("open_box")).toBe("https://schema.org/NewCondition");
    expect(schemaItemCondition("used")).toBe("https://schema.org/UsedCondition");
  });

  it("never emits RefurbishedCondition and offers both fulfilment routes", () => {
    const emitted = (["new", "open_box", "used"] as const).map(schemaItemCondition);
    expect(emitted).not.toContain("https://schema.org/RefurbishedCondition");
    expect(offerDeliveryMethods).toEqual([
      "https://schema.org/OnSitePickup",
      "https://schema.org/ParcelService",
    ]);
  });

  it("keeps sold-out offers OutOfStock instead of dropping the URL", () => {
    expect(schemaAvailability(3)).toBe("https://schema.org/InStock");
    expect(schemaAvailability(1)).toBe("https://schema.org/InStock");
    expect(schemaAvailability(0)).toBe("https://schema.org/OutOfStock");
    expect(schemaAvailability(null)).toBe("https://schema.org/OutOfStock");
    expect(schemaAvailability(undefined)).toBe("https://schema.org/OutOfStock");
  });

  it("uses exactly the approved customer-facing labels", () => {
    expect(conditionLabels.de).toEqual({
      new: "Neu (Versiegelt)",
      open_box: "Neu – Open Box",
      used: "Gebraucht – Zustand A+",
    });
    expect(conditionLabels.en).toEqual({
      new: "New (Sealed)",
      open_box: "New – Open Box",
      used: "Used – Grade A+",
    });
  });
});
