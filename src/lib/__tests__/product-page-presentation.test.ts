import { describe, expect, it } from "vitest";

import { getProductPageSignals, getSafeConditionNote } from "../product-page-presentation";

describe("product page presentation signals", () => {
  it("creates transparent used-device signals without inventing a battery value", () => {
    const signals = getProductPageSignals({
      locale: "de",
      condition: "used",
      stock: 4,
      batteryHealth: undefined,
      hasRealProductPhotos: true,
    });

    expect(signals.conditionTitle).toBe("Zustand transparent");
    expect(signals.conditionLabel).toBe("Gebraucht");
    expect(signals.stockLabel).toBe("4 verfügbar");
    expect(signals.realPhotosLabel).toBe("Echte Produktfotos");
    expect(signals.batteryLabel).toBeNull();
  });

  it("uses localized new-product and out-of-stock signals", () => {
    const signals = getProductPageSignals({
      locale: "en",
      condition: "new",
      stock: 0,
      batteryHealth: 100,
      hasRealProductPhotos: false,
    });

    expect(signals.conditionLabel).toBe("New & sealed");
    expect(signals.stockLabel).toBe("Sold out");
    expect(signals.fulfillmentLabel).toBe("Not currently available");
    expect(signals.batteryLabel).toBe("Battery health: 100%");
    expect(signals.realPhotosLabel).toBeNull();
  });

  it("suppresses contradictory condition notes instead of amplifying bad catalog data", () => {
    expect(getSafeConditionNote({ condition: "used", model: "13T Pro", note: "Das Smartphone ist fabrikneu und unbenutzt." })).toBeNull();
    expect(getSafeConditionNote({ condition: "open_box", model: "iPhone 15 Pro", note: "Das iPhone 15 Pro Max befindet sich in einem fast neuwertigen Zustand." })).toBeNull();
    expect(getSafeConditionNote({ condition: "used", model: "T20 LTE", note: "Zustand A+ – sehr guter Zustand, nahezu neuwertig." })).toContain("Zustand A+");
    expect(getSafeConditionNote({ condition: "used", model: "T20 LTE", note: "Factory new and unused." })).toBeNull();
  });

  it("keeps unknown stock aligned with the existing unavailable state", () => {
    const signals = getProductPageSignals({ locale: "de", condition: "new", stock: undefined, hasRealProductPhotos: false });
    expect(signals.stockLabel).toBe("Ausverkauft");
    expect(signals.fulfillmentLabel).toBe("Derzeit nicht verfügbar");
  });
});
