/**
 * Slot math for the hero deal deck.
 *
 * The deck is a three-card window over the campaign list: the active deal is in
 * front, the next two sit behind it, and everything else waits out of sight.
 * Keeping the arithmetic here makes the wrap-around testable without a browser.
 */
export type DeckSlot = "front" | "next" | "back" | "hidden";

export function deckSlot(index: number, active: number, count: number): DeckSlot {
  if (count <= 0) return "hidden";
  const distance = ((index - active) % count + count) % count;
  if (distance === 0) return "front";
  if (distance === 1) return "next";
  if (distance === 2) return "back";
  return "hidden";
}

/** Wrap a step through the list; a negative delta walks backwards. */
export function deckStep(active: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return ((active + delta) % count + count) % count;
}
