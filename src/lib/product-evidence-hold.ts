/** Only a boolean reaches product DTOs; private evidence and notes stay server-side. */
export const requiresEnergyEvidenceReview = (metadata: unknown): boolean => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const review = (metadata as Record<string, unknown>).energyEvidenceReview;
  return Boolean(review && typeof review === 'object' && !Array.isArray(review)
    && (review as Record<string, unknown>).status === 'needs_supplier_confirmation');
};
