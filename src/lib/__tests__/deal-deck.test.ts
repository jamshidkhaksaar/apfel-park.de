import { describe, expect, it } from "vitest";

import { deckSlot, deckStep } from "../deal-deck";

const slots = (active: number, count: number) =>
  Array.from({ length: count }, (_, index) => deckSlot(index, active, count));

describe("hero deal deck", () => {
  it("shows the active deal in front and the next two behind it", () => {
    expect(slots(0, 6)).toEqual(["front", "next", "back", "hidden", "hidden", "hidden"]);
  });

  it("wraps the window around the end of the list", () => {
    expect(slots(5, 6)).toEqual(["next", "back", "hidden", "hidden", "hidden", "front"]);
  });

  it("keeps exactly one card in each visible slot", () => {
    for (let active = 0; active < 8; active += 1) {
      const visible = slots(active, 8).filter((slot) => slot !== "hidden");
      expect(new Set(visible).size).toBe(visible.length);
      expect(visible).toHaveLength(3);
    }
  });

  it("steps forwards and backwards with wrap-around", () => {
    expect(deckStep(0, 1, 6)).toBe(1);
    expect(deckStep(5, 1, 6)).toBe(0);
    expect(deckStep(0, -1, 6)).toBe(5);
    expect(deckStep(2, 3, 6)).toBe(5);
  });

  it("never moves a single-card deck or an empty one", () => {
    expect(deckStep(0, 1, 1)).toBe(0);
    expect(deckStep(0, -1, 0)).toBe(0);
    expect(slots(0, 1)).toEqual(["front"]);
    expect(slots(0, 0)).toEqual([]);
    expect(deckSlot(0, 0, 0)).toBe("hidden");
  });

  it("has no third visible slot when only two deals exist", () => {
    expect(slots(0, 2)).toEqual(["front", "next"]);
    expect(slots(1, 2)).toEqual(["next", "front"]);
  });
});
