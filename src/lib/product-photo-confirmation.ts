/** Reordering the same photos preserves confirmation; changed membership does not. */
export const photoMembershipChanged = (before: readonly string[], after: readonly string[]): boolean => {
  const previous = new Set(before.filter(Boolean));
  const next = new Set(after.filter(Boolean));
  return previous.size !== next.size || [...previous].some(url => !next.has(url));
};
