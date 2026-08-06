import { describe, expect, it } from "vitest";

import { groupSpecs } from "../product-spec-group";
import type { ProductSpec } from "../products";

const spec = (label: string, value = "v", group?: string): ProductSpec =>
  group ? { label, value, group } : { label, value };

describe("groupSpecs", () => {
  it("keeps ungrouped specs in a single unlabelled block, preserving order", () => {
    const specs = [spec("Display", "6,1 Zoll"), spec("Speicher", "128 GB")];
    expect(groupSpecs(specs)).toEqual([
      {
        group: "",
        items: [
          { label: "Display", value: "6,1 Zoll" },
          { label: "Speicher", value: "128 GB" },
        ],
      },
    ]);
  });

  it("groups specs in insertion order", () => {
    const specs = [
      spec("Größe", "6,1 Zoll", "Display"),
      spec("Auflösung", "2556×1179", "Display"),
      spec("Kapazität", "3561 mAh", "Akku"),
      spec("Marke", "Apple"),
    ];
    expect(groupSpecs(specs)).toEqual([
      {
        group: "Display",
        items: [
          { label: "Größe", value: "6,1 Zoll", group: "Display" },
          { label: "Auflösung", value: "2556×1179", group: "Display" },
        ],
      },
      {
        group: "Akku",
        items: [{ label: "Kapazität", value: "3561 mAh", group: "Akku" }],
      },
      {
        group: "",
        items: [{ label: "Marke", value: "Apple" }],
      },
    ]);
  });

  it("merges a repeated group into the first block, keeping insertion order", () => {
    const specs = [spec("a", "1", "Display"), spec("b", "2", "Akku"), spec("c", "3", "Display")];
    const groups = groupSpecs(specs);
    expect(groups.map((g) => g.group)).toEqual(["Display", "Akku"]);
    expect(groups[0].items.map((s) => s.label)).toEqual(["a", "c"]);
  });

  it("treats a whitespace-only group as ungrouped", () => {
    const specs = [spec("a", "1", "   "), spec("b", "2")];
    expect(groupSpecs(specs)).toHaveLength(1);
    expect(groupSpecs(specs)[0].items).toHaveLength(2);
  });

  it("handles an empty array", () => {
    expect(groupSpecs([])).toEqual([]);
  });
});
