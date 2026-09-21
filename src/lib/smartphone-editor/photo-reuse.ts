type OfferIdentity = { brand?: string; model?: string; color?: string; condition?: string };
const normalized = (value?: string): string => value?.trim().toLowerCase() ?? '';

export const photoReuseError = (current: OfferIdentity, previous: OfferIdentity, confirmed: boolean): string | null => {
  if (['brand', 'model', 'color'].some(key => {
    const field = key as 'brand' | 'model' | 'color';
    return !normalized(current[field]) || normalized(current[field]) !== normalized(previous[field]);
  })) return 'device_photo_reused';
  if ((current.condition !== 'new' || previous.condition !== 'new') && !confirmed)
    return 'shared_photos_confirmation_required';
  return null;
};
