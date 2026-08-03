import { notFound } from "next/navigation";

import { isLocale, type Locale } from "./i18n";

/**
 * Narrows a raw `[lang]` route param to a Locale, 404ing on anything else.
 *
 * The (site)/[lang] layout guards too, but the App Router renders layout,
 * page and generateMetadata in PARALLEL — the layout's notFound() does not
 * gate the page. Every page and generateMetadata must guard for itself, or
 * an unknown locale reaches code that indexes Record<Locale, T> by it and
 * throws a TypeError (500) instead of returning 404.
 */
export const requireLocale = (value: string): Locale => {
  if (!isLocale(value)) {
    notFound();
  }
  return value;
};
