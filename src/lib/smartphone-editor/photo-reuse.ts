type OfferIdentity = { brand?: string; model?: string; color?: string; condition?: string };
export const photoReuseError = (current: OfferIdentity, previous: OfferIdentity, confirmed: boolean): string | null => {
  // Catalog photos are reusable assets, not exclusive model/color ownership.
  // Used-device evidence still needs staff confirmation for the receiving offer.
  if ((current.condition !== 'new' || previous.condition !== 'new') && !confirmed)
    return 'shared_photos_confirmation_required';
  return null;
};
