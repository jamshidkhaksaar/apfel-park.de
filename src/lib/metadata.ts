import type { Metadata } from "next";

import { locales as allLocales, type Locale } from "./i18n";
import { getSeoRouteIdByPath, getSeoSettings, splitKeywords } from "./seo";
import { siteInfo } from "./site";

const normalizePath = (path: string) => {
  if (!path) {
    return "";
  }
  return path.startsWith("/") ? path : `/${path}`;
};

const normalizeImageUrl = (value: string) => {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${siteInfo.url}${value.startsWith("/") ? value : `/${value}`}`;
};

export const normalizeMetadataTitle = (value: string): string =>
  value
    .trim()
    .replace(/\s*[–-]\s*Apfel Park Hamburg$/i, " – Hamburg")
    .replace(/\s*\|\s*Apfel Park$/i, "")
    .trim();

export type CreateMetadataOptions = {
  /** Force noindex regardless of route settings (cart, checkout, …). */
  noindex?: boolean;
  /** Locales this page exists in; limits hreflang alternates (default: all). */
  locales?: Locale[];
};

export const createMetadata = async (
  locale: Locale,
  title: string,
  description: string,
  path: string,
  imageOverride?: string,
  options?: CreateMetadataOptions,
): Promise<Metadata> => {
  const normalizedPath = normalizePath(path);
  const pathWithLocale = `/${locale}${normalizedPath}`;
  const canonical = `${siteInfo.url}${pathWithLocale}`;
  const routeId = getSeoRouteIdByPath(normalizedPath || "/");
  const settings = await getSeoSettings();
  const global = settings.global;
  const route = routeId ? settings.pages[routeId] : null;
  const routeMetadata = route ? route.locales[locale] : null;
  // Registered routes: admin/default route copy wins so /admin/seo overrides work.
  // Unregistered paths (products, articles, …): the page-supplied copy wins.
  const resolvedTitle = normalizeMetadataTitle(routeMetadata ? routeMetadata.title || title : title);
  const resolvedDescription = routeMetadata
    ? routeMetadata.description || description
    : description;
  const keywordLocale = allLocales.includes(locale) ? locale : "de";
  const keywords = splitKeywords(
    routeMetadata?.keywords || global.defaultKeywords[keywordLocale],
  );
  const image = normalizeImageUrl(imageOverride || global.defaultOgImage);
  const index = !options?.noindex && (route ? route.index : true);
  const availableLocales = options?.locales?.length ? options.locales : allLocales;
  const languageAlternates: Record<string, string> = {};
  for (const altLocale of availableLocales) {
    languageAlternates[altLocale] = `${siteInfo.url}/${altLocale}${normalizedPath}`;
  }
  if (availableLocales.includes("de")) {
    languageAlternates["x-default"] = `${siteInfo.url}/de${normalizedPath}`;
  }

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords,
    robots: {
      index,
      // noindex, follow -- a page we do not want indexed should still pass
      // its links. Tying follow to index made /gaming emit "noindex, nofollow",
      // which needlessly dead-ends its internal links.
      follow: true,
    },
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonical,
      type: "website",
      siteName: siteInfo.name,
      images: image ? [{ url: image }] : undefined,
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: image ? [image] : undefined,
    },
  };
};
