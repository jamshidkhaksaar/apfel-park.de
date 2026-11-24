/** Public business facts supplied by the proprietor. No private KYC data belongs here. */
type PublicPhone = Readonly<{ e164: `+${number}`; de: string; en: string }>;
type BusinessIdentity = Readonly<{
  tradingName: string;
  legalOwner: string;
  legalForm: Readonly<Record<'de' | 'en', string>>;
  website: `https://${string}`;
  email: string;
  address: Readonly<{ street: string; postalCode: string; city: string; countryCode: 'DE'; countryDe: string; countryEn: string }>;
  phones: Readonly<{ legalBusiness: PublicPhone; customerService: PublicPhone; store: PublicPhone }>;
  registration: Readonly<{ authority: string; businessStart: string; certificateDate: string; handelsregisterRegistered: false }>;
  vatId: string;
}>;

export const businessIdentity = {
  tradingName: 'Apfel Park',
  legalOwner: 'Bismaillah Safi',
  legalForm: { de: 'Einzelunternehmen', en: 'Sole proprietorship' },
  website: 'https://apfel-park.de',
  email: 'info@apfel-park.de',
  address: { street: 'Wilhelm-Strauß-Weg 2b', postalCode: '21109', city: 'Hamburg', countryCode: 'DE', countryDe: 'Deutschland', countryEn: 'Germany' },
  phones: {
    legalBusiness: { e164: '+4917630126041', de: '+49 176 30126041', en: '+49 176 30126041' },
    customerService: { e164: '+491637786476', de: '0163 7786476', en: '+49 163 7786476' },
    store: { e164: '+494058978787', de: '040 58978787', en: '+49 40 58978787' },
  },
  registration: {
    authority: 'Freie und Hansestadt Hamburg, Bezirksamt Hamburg-Mitte',
    businessStart: '2025-11-17',
    certificateDate: '2025-12-18',
    handelsregisterRegistered: false,
  },
  // Existing published value retained, NOT independently verified as assigned
  // to this proprietor. Owner must confirm assignment with BZSt / Finanzamt.
  vatId: 'DE345074336',
} as const satisfies BusinessIdentity;

/**
 * The verified Google Business Profile listing. The CID form is the stable
 * public URL: it survives Maps redesigns, unlike the /maps/place/ URL.
 */
export const googleBusinessProfileUrl = 'https://maps.google.com/?cid=18022836003772936884';

export const businessAddress = (lang: 'de' | 'en', country = true): string => {
  const a = businessIdentity.address;
  return `${a.street}, ${a.postalCode} ${a.city}${country ? `, ${lang === 'de' ? a.countryDe : a.countryEn}` : ''}`;
};

export const legalProvider = (lang: 'de' | 'en'): string => lang === 'de'
  ? `${businessIdentity.legalOwner}, handelnd unter der Geschäftsbezeichnung ${businessIdentity.tradingName}`
  : `${businessIdentity.legalOwner}, trading as ${businessIdentity.tradingName}`;

export const legalIdentityText = (lang: 'de' | 'en'): string => `${legalProvider(lang)}, ${businessAddress(lang)}`;

/** Identity fragment shared by the single stable Store/LocalBusiness entity. */
/**
 * Two linked entities, because the business serves two different areas:
 *
 * - `#online-store` (OnlineStore): the online shop. It ships to every address
 *   in Germany, so it serves the whole country and is the seller of every
 *   product offer.
 * - `#store` (MobilePhoneStore): the shop in the LunaCenter. Repairs, advice,
 *   trade-in and collection happen there, so it serves Hamburg. It is the
 *   entity that matches the Google Business Profile.
 *
 * Mixing them made Google read the online shop as Hamburg-only.
 */
export const onlineStoreSchemaId = `${businessIdentity.website}/#online-store`;
export const localStoreSchemaId = `${businessIdentity.website}/#store`;

export const onlineStoreSchemaIdentity = {
  '@type': 'OnlineStore',
  '@id': onlineStoreSchemaId,
  name: businessIdentity.tradingName,
  legalName: legalProvider('de'),
  url: businessIdentity.website,
  description: 'Online-Shop von Apfel Park für neue, Open-Box- und geprüfte gebrauchte Smartphones, Tablets, Laptops und Zubehör mit versichertem Versand in ganz Deutschland. Abholung ist kostenlos im Ladengeschäft in Hamburg-Wilhelmsburg möglich.',
  email: businessIdentity.email,
  telephone: businessIdentity.phones.store.e164,
  vatID: businessIdentity.vatId,
  address: {
    '@type': 'PostalAddress',
    streetAddress: businessIdentity.address.street,
    postalCode: businessIdentity.address.postalCode,
    addressLocality: businessIdentity.address.city,
    addressRegion: 'Hamburg',
    addressCountry: businessIdentity.address.countryCode,
  },
  areaServed: { '@type': 'Country', name: 'Deutschland', identifier: 'DE' },
  knowsLanguage: ['de', 'en'],
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Kreditkarte, Apple Pay, Klarna',
  // The physical shop belongs to the same business.
  subOrganization: { '@id': localStoreSchemaId },
} as const;

export const businessSchemaIdentity = {
  // MobilePhoneStore is a LocalBusiness subtype and the most specific type
  // schema.org offers for this shop, which is what local/AI results key on.
  '@type': ['MobilePhoneStore', 'LocalBusiness'],
  '@id': `${businessIdentity.website}/#store`,
  name: businessIdentity.tradingName,
  // The registered Einzelunternehmen, not just the proprietor's name: the
  // legal entity is "Bismaillah Safi, handelnd unter der Geschäftsbezeichnung
  // Apfel Park" and the Impressum states it the same way.
  legalName: legalProvider('de'),
  founder: { '@type': 'Person', name: businessIdentity.legalOwner },
  owner: { '@type': 'Person', name: businessIdentity.legalOwner },
  url: businessIdentity.website,
  description: 'Apfel Park ist ein Smartphone-Fachgeschäft mit Reparaturwerkstatt im LunaCenter in Hamburg-Wilhelmsburg. Das Unternehmen verkauft neue, Open-Box- und gebrauchte Smartphones, Tablets, Laptops und Zubehör und repariert iPhone-, Samsung-Galaxy- und weitere Smartphone-Modelle zu modellbezogenen Preisen.',
  // The shop landline is the canonical business phone. The proprietor's mobile
  // stays in contactPoint only, so crawlers do not read two "main" numbers.
  telephone: businessIdentity.phones.store.e164,
  email: businessIdentity.email,
  vatID: businessIdentity.vatId,
  address: {
    '@type': 'PostalAddress',
    // Kept byte-identical to the Google Business Profile so NAP stays aligned;
    // the LunaCenter is expressed through containedInPlace instead of being
    // appended to the street, which Google would read as a different address.
    streetAddress: businessIdentity.address.street,
    postalCode: businessIdentity.address.postalCode,
    addressLocality: businessIdentity.address.city,
    addressRegion: 'Hamburg',
    addressCountry: businessIdentity.address.countryCode,
  },
  containedInPlace: { '@type': 'ShoppingCenter', name: 'LunaCenter' },
  // Local services (repairs, advice, trade-in, collection) are offered in
  // Hamburg; online sales to the rest of Germany belong to #online-store.
  areaServed: [
    { '@type': 'City', name: 'Hamburg' },
    { '@type': 'Place', name: 'Hamburg-Wilhelmsburg' },
  ],
  parentOrganization: { '@id': onlineStoreSchemaId },
  // Coordinates of the verified Google Business Profile listing, read from
  // the Maps place URL. These must match the profile pin, so they are not
  // derived from OpenStreetMap: the LunaCenter building centroid sat about
  // 60 m away from the pin Google actually serves.
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 53.4978489,
    longitude: 10.009244,
  },
  knowsLanguage: ['de', 'en'],
  priceRange: '€€',
  paymentAccepted: 'Kreditkarte, Apple Pay, Klarna, Barzahlung, Debitkarte',
  contactPoint: [businessIdentity.phones.store, businessIdentity.phones.customerService].map(phone => ({
    '@type': 'ContactPoint',
    telephone: phone.e164,
    contactType: 'customer service',
    areaServed: 'DE',
    availableLanguage: ['de', 'en'],
  })),
} as const;
