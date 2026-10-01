export type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types: string[];
};

export type GermanPlacesAddress = { line1: string; postalCode: string; city: string };

const normalize = (value: string | undefined): string => (value ?? '').trim().replace(/\s+/g, ' ');

export const mapGermanAddress = (components: GoogleAddressComponent[]): GermanPlacesAddress | null => {
  const text = (type: string): string => normalize(components.find((part) => part.types.includes(type))?.longText);
  const route = text('route');
  const number = text('street_number');
  const city = text('locality') || text('postal_town') || text('administrative_area_level_3');
  const postalCode = text('postal_code');
  const country = normalize(components.find((part) => part.types.includes('country'))?.shortText);
  if (!route || !number || !city || !/^\d{5}$/.test(postalCode) || country !== 'DE') return null;
  return { line1: `${route} ${number}`, postalCode, city };
};
