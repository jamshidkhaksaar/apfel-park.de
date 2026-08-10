export const defaultSocialLinks = {
  instagram: "https://www.instagram.com/apfelpark.hh/",
  facebook: "https://www.facebook.com/profile.php?id=61589053646278",
  tiktok: "https://www.tiktok.com/@apfelpark.hh",
  whatsapp: "https://wa.me/491637786476",
};

export const siteInfo = {
  name: "Apfel Park",
  legalName: "Apfel Park",
  vatId: "DE345074336",
  tagline: "Smart Phone. Smart Service. Smart Price.",
  url: "https://apfel-park.de",
  // Primary contact: the WhatsApp Business line. This is also the number on the
  // Google Business Profile, and Google reads a mismatch between the profile
  // and the site as a sign the business is not well established -- so these two
  // must stay identical.
  phone: "0163 7786476",
  phoneE164: "+491637786476",
  // The shop landline, shown alongside the primary number for people who
  // would rather call the counter.
  landline: "040 58978787",
  landlineE164: "+494058978787",
  whatsapp: "491637786476", // WhatsApp Business number, no + sign
  email: "info@apfel-park.de",
  // Google Merchant Center id. Public by design -- it ships in the Customer
  // Reviews opt-in on the confirmation page -- so it is config, not a secret.
  googleMerchantId: "5829541150",
  // Section 5 DDG requires the natural person behind an Einzelunternehmen to be
  // named, and the Impressum did not name anyone. Kept out of the LocalBusiness
  // telephone and contactPoint on purpose: those must keep matching the Google
  // Business Profile exactly, and a third number there reads as a mismatch.
  owner: {
    name: "Bismaillah Safi",
    roleDe: "Inhaber",
    roleEn: "Owner",
    phone: "+49 176 30126041",
    phoneE164: "+4917630126041",
    photo: "/images/owner/bismiallah-safi.webp",
  },
  address: {
    street: "Wilhelm-Strauß-Weg 2b",
    city: "Hamburg",
    postalCode: "21109",
    country: "Deutschland",
  },
  hours: {
    days: "Montag – Samstag",
    time: "09:30 – 20:00",
  },
  social: defaultSocialLinks,
  map: {
    query: "Wilhelm-Strauß-Weg 2b, 21109 Hamburg",
    embedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=Wilhelm-Strau%C3%9F-Weg+2b,+21109+Hamburg`
      : "https://www.google.com/maps?q=Wilhelm-Strau%C3%9F-Weg+2b%2C+21109+Hamburg&output=embed",
    linkUrl: "https://maps.google.com/?q=Wilhelm-Strau%C3%9F-Weg+2b+21109+Hamburg",
  },
};
