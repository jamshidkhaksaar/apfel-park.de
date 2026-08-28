import type { Locale } from "./i18n";

const GOOGLE_PREFERRED_SOURCE_URL = "https://www.google.com/preferences/source?q=apfel-park.de";

export type GooglePreferredSourceBadge = {
  href: string;
  imageSrc: string;
  alt: string;
};

export const getGooglePreferredSourceBadge = (locale: Locale): GooglePreferredSourceBadge => ({
  href: GOOGLE_PREFERRED_SOURCE_URL,
  imageSrc: `/branding/google-preferred-source/${locale}.png`,
  alt: locale === "de"
    ? "Als bevorzugte Quelle auf Google hinzufügen"
    : "Add as a preferred source on Google",
});
