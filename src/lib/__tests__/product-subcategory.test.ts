import { describe, expect, it } from "vitest";

import { classifySubcategory, subcategoryLabel } from "../product-subcategory";

const accessory = (title: string) => classifySubcategory("accessories", title);

describe("classifySubcategory", () => {
  it("leaves non-accessory categories alone", () => {
    expect(classifySubcategory("smartphones", "iPhone 15 Pro Max 256GB")).toBe("smartphones");
    expect(classifySubcategory("tablets", "iPad Air")).toBe("tablets");
  });

  it.each([
    ["Celly GELSKIN TPU COVER iPhone 17 Transparent", "cases-silicone"],
    ["Celly WALLY Hülle iPhone 12 Pro / 12 Schwarz", "cases-wallet"],
    ["Tumi TUHCP14LRCPK iPhone 14 Pro Leder-Hartschale mit Kartenfach", "cases-wallet"],
    ["BMW BMHCP13LPCUMRBK iPhone 13 Pro transparente Hartschale", "cases-hard"],
    ["TRUSMI Akku für die Apple iPhone 15-Serie", "charging"],
    ["TRUSMI WS02-021 Digitale In-Ear-True-Wireless-Kopfhörer", "audio"],
    ["TRUSMI WH01-011 Sport-Smartwatch", "wearables"],
    ["TRUSMI MU03-02 Ergonomische Funkmaus, Weiß", "computer"],
    ["TRUSMI LP17-02 Oxford-Laptoptasche 14,1-15,4 Zoll", "bags"],
    ["TRUSMI BA01-01 Elektrischer Nasenhaarschneider Schwarz", "other"],
  ])("classifies %s as %s", (title, expected) => {
    expect(accessory(title)).toBe(expected);
  });

  // Order-sensitive cases: these are the ones that break when rules get reordered.
  it("treats a MagSafe case as a case, not a mount", () => {
    expect(accessory("GUESS Beige Lace Pattern MagSafe Case")).toMatch(/^cases-/);
    expect(accessory("BMW M IML Metal Logos MagSafe für iPhone 17 Pro Orange")).toMatch(/^cases-/);
  });

  it("treats a MagSafe charger as charging, not a case", () => {
    expect(accessory("MagSafe Ladegerät 15W Weiß")).toBe("charging");
  });

  it("treats a case with a grip as a case, not a holder", () => {
    expect(accessory("Hülle JE PopGrip iPhone 14 Light Pink")).toMatch(/^cases-/);
  });

  it("does not mistake a ring light for a phone ring holder", () => {
    expect(accessory("14-Zoll-Ringlicht der TRUSMI LP22-Serie")).toBe("other");
  });

  it("reads the case type out of the manufacturer part number", () => {
    // GUHC... is a Guess hard case; the title never says "Hardcase".
    expect(accessory("Guess GUHCZFD6GF4GBR Z Fold6 F956 braun 4G")).toBe("cases-hard");
    // KLHM... is a Karl Lagerfeld MagSafe case.
    expect(accessory("Karl Lagerfeld KLHMP17L5HKSCAO Choupette für iPhone 17 Pro")).toBe("cases-other");
  });

  it("falls back to a case when the title only names a phone", () => {
    expect(accessory("Celly EARTH iPhone 11 Pro Max WHITE")).toBe("cases-other");
  });

  it("returns other when nothing matches", () => {
    expect(accessory("Tisch-Clip-Ventilator")).toBe("other");
  });
});

describe("subcategoryLabel", () => {
  it("localises known slugs", () => {
    expect(subcategoryLabel("cases-wallet", "de")).toBe("Klapphüllen");
    expect(subcategoryLabel("cases-wallet", "en")).toBe("Wallet cases");
  });

  it("falls back to the slug for unknown values", () => {
    expect(subcategoryLabel("made-up", "de")).toBe("made-up");
  });
});
