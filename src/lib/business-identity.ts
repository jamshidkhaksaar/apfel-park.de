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

export const businessAddress = (lang: 'de' | 'en', country = true): string => {
  const a = businessIdentity.address;
  return `${a.street}, ${a.postalCode} ${a.city}${country ? `, ${lang === 'de' ? a.countryDe : a.countryEn}` : ''}`;
};

export const legalProvider = (lang: 'de' | 'en'): string => lang === 'de'
  ? `${businessIdentity.legalOwner}, handelnd unter der Geschäftsbezeichnung ${businessIdentity.tradingName}`
  : `${businessIdentity.legalOwner}, trading as ${businessIdentity.tradingName}`;

export const legalIdentityText = (lang: 'de' | 'en'): string => `${legalProvider(lang)}, ${businessAddress(lang)}`;

/** Identity fragment shared by the single stable Store/LocalBusiness entity. */
export const businessSchemaIdentity = {
  '@type': ['Store', 'LocalBusiness'],
  '@id': `${businessIdentity.website}/#store`,
  name: businessIdentity.tradingName,
  legalName: businessIdentity.legalOwner,
  url: businessIdentity.website,
  telephone: businessIdentity.phones.legalBusiness.e164,
  email: businessIdentity.email,
  vatID: businessIdentity.vatId,
  address: {
    '@type': 'PostalAddress',
    streetAddress: businessIdentity.address.street,
    postalCode: businessIdentity.address.postalCode,
    addressLocality: businessIdentity.address.city,
    addressCountry: businessIdentity.address.countryCode,
  },
  contactPoint: [businessIdentity.phones.customerService, businessIdentity.phones.store].map(phone => ({
    '@type': 'ContactPoint',
    telephone: phone.e164,
    contactType: 'customer service',
    areaServed: 'DE',
    availableLanguage: ['de', 'en'],
  })),
} as const;
