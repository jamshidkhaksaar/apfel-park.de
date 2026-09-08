import { businessAddress, businessIdentity } from './business-identity';

export const defaultSocialLinks = {
  instagram: "https://www.instagram.com/apfelpark.hh/",
  facebook: "https://www.facebook.com/profile.php?id=61589053646278",
  tiktok: "https://www.tiktok.com/@apfelpark.hh",
  whatsapp: `https://wa.me/${businessIdentity.phones.customerService.e164.slice(1)}`,
};

export const siteInfo = {
  name: businessIdentity.tradingName,
  // Apfel Park is the public trading name. The Gewerbeanmeldung identifies the
  // Einzelunternehmen by the proprietor's personal legal name, so structured
  // data and verification-facing fields must not present the brand as a
  // separate legal entity.
  legalName: businessIdentity.legalOwner,
  legalFormDe: businessIdentity.legalForm.de,
  legalFormEn: businessIdentity.legalForm.en,
  businessRegistration: {
    authority: businessIdentity.registration.authority,
    legalBasisDe: "Gewerbeanzeige gemäß § 14 GewO",
    legalBasisEn: "Trade notification pursuant to § 14 GewO",
    businessStartDate: businessIdentity.registration.businessStart,
    certificateDate: businessIdentity.registration.certificateDate,
    commercialRegisterDe: "Nicht im Handelsregister eingetragen",
    commercialRegisterEn: "Not entered in the commercial register",
  },
  vatId: businessIdentity.vatId,
  tagline: "Smart Phone. Smart Service. Smart Price.",
  url: businessIdentity.website,
  // Customer-facing contact; the verification/legal phone has a separate role.
  phone: businessIdentity.phones.customerService.de,
  phoneE164: businessIdentity.phones.customerService.e164,
  // The shop landline, shown alongside the primary number for people who
  // would rather call the counter.
  landline: businessIdentity.phones.store.de,
  landlineE164: businessIdentity.phones.store.e164,
  whatsapp: businessIdentity.phones.customerService.e164.slice(1),
  email: businessIdentity.email,
  // Google Merchant Center id. Public by design -- it ships in the Customer
  // Reviews opt-in on the confirmation page -- so it is config, not a secret.
  googleMerchantId: "5829541150",
  // Merchant Center local listings use this exact, case-sensitive shop code
  // to join every inventory row to the Hamburg Business Profile. Google does
  // not treat it as a credential, but changing it would break that join.
  googleBusinessProfile: {
    storeCode: "12632968340985409161",
  },
  // The badge shows the seller rating, but with no ratings yet Google renders
  // "no rating available" on every page it appears on. Set this to false to
  // remove it until the first ratings come in.
  googleReviewsBadge: true,
  // Public proprietor details, distinct from customer service and the landline.
  owner: {
    name: businessIdentity.legalOwner,
    roleDe: "Inhaber",
    roleEn: "Owner",
    phone: businessIdentity.phones.legalBusiness.de,
    phoneE164: businessIdentity.phones.legalBusiness.e164,
    photo: "/images/owner/bismaillah-safi.webp",
  },
  address: {
    street: businessIdentity.address.street,
    city: businessIdentity.address.city,
    postalCode: businessIdentity.address.postalCode,
    country: businessIdentity.address.countryDe,
  },
  hours: {
    days: "Montag – Samstag",
    time: "09:30 – 20:00",
  },
  social: defaultSocialLinks,
  map: {
    query: businessAddress('de', false),
    embedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(businessAddress('de', false))}`
      : `https://www.google.com/maps?q=${encodeURIComponent(businessAddress('de', false))}&output=embed`,
    linkUrl: `https://maps.google.com/?q=${encodeURIComponent(businessAddress('de', false))}`,
  },
};
