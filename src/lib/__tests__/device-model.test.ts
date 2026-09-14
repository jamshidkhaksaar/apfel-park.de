import { describe, expect, it } from "vitest";

import { deviceModelNeedles } from "../device-model";

// Titles taken verbatim from the production catalog.
describe("deviceModelNeedles", () => {
  it.each([
    ["Celly GELSKINMAG iPhone 16 Pro Max Hülle Weiß", ["iphone 16 pro max"]],
    ["GUESS GUHCP17M4GMGPI HardCase 4G PU Big Logo Pink iPhone 17 Air", ["iphone 17 air"]],
    ["Celly WALLY Hülle iPhone 12 Pro / 12 Schwarz", ["iphone 12 pro"]],
    ["TRUSMI Akku für die Apple iPhone 15-Serie", ["iphone 15"]],
    ["Apple iphone 17 pro max 256GB-Neu", ["iphone 17 pro max"]],
    ["Celly CROMO - Cover für Samsung Galaxy A55 5G Schwarz", ["galaxy a55"]],
    ["Samsung Galaxy S24 Ultra 256 GB", ["galaxy s24 ultra"]],
    ["Samsung Galaxy S20 FE 128 GB", ["galaxy s20 fe"]],
    ["Guess GUHMZFD7P4MSEGCK 4G Classic MagSafe für Samsung Galaxy Z Fold7 schwarz", ["z fold7", "z fold 7"]],
    ["Celly GELSKINMAG - Samsung Z Flip 5 MagSafe Cover", ["z flip5", "z flip 5"]],
    ["BMW BMHCS23L22PTDK S23 Ultra S918 schwarz Leder Stempel Tricolor", ["s23 ultra"]],
    ["Google Pixel 8 Pro 128 GB", ["pixel 8 pro"]],
    ["Xiaomi Redmi Note 13 128 GB", ["redmi note 13"]],
    ["Apple 13\" iPad Pro (M4) 256GB", ["ipad pro 13", "13 ipad pro"]],
    ["Apple iPad Pro 13″ (M5) Space Schwarz", ["ipad pro 13", "13 ipad pro"]],
    ["Apple iPad Air 11″ (M2) 128GB Blau", ["ipad air 11", "11 ipad air"]],
    ["Apple iPad (10. Generation) 64GB Silber", ["ipad 10", "10 ipad"]],
    ["Apple iPad mini (A17 Pro) 128GB", ["ipad mini a17 pro", "a17 pro ipad mini"]],
    ["Lenovo ThinkPad T14 G6", ["thinkpad t14 gen 6", "thinkpad t14 g6", "t14 gen 6", "t14 g6"]],
    ["ThinkPad T14 Gen 6 Intel", ["thinkpad t14 gen 6", "thinkpad t14 g6", "t14 gen 6", "t14 g6"]],
    ["Lenovo ThinkPad X1 Carbon Gen 12", ["thinkpad x1 carbon gen 12", "thinkpad x1 carbon g12", "x1 carbon gen 12", "x1 carbon g12"]],
  ])("%s -> %j", (title, expected) => {
    expect(deviceModelNeedles(title)).toEqual(expected);
  });

  it("returns nothing for products without a device model", () => {
    expect(deviceModelNeedles("TRUSMI BA01-01 Elektrischer Nasenhaarschneider Schwarz")).toEqual([]);
    expect(deviceModelNeedles("TRUSMI MU03-02 Ergonomische Funkmaus, Weiß")).toEqual([]);
  });

  it("does not treat bare part numbers as S-series models", () => {
    expect(deviceModelNeedles("Guess GUHCP15LPSP4LGE Hardcase")).toEqual([]);
  });
});
