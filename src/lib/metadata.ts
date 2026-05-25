import type { Metadata } from "next";

import type { Locale } from "./i18n";
import { getSeoRouteIdByPath, resolveSeoPage, splitKeywords } from "./seo";
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

export const createMetadata = async (
  locale: Locale,
  title: string,
  description: string,
  path: string,
  imageOverride?: string,
): Promise<Metadata> => {
  const normalizedPath = normalizePath(path);
  const pathWithLocale = `/${locale}${normalizedPath}`;
  const canonical = `${siteInfo.url}${pathWithLocale}`;
  const routeId = getSeoRouteIdByPath(normalizedPath || "/");
  const { global, route, metadata } = await resolveSeoPage(routeId, locale);
  const resolvedTitle = metadata.title || title;
  const resolvedDescription = metadata.description || description;
  const keywords = splitKeywords(metadata.keywords || global.defaultKeywords[locale]);
  const image = normalizeImageUrl(imageOverride || global.defaultOgImage);

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords,
    robots: {
      index: route.index,
      follow: route.index,
    },
    alternates: global.forceCanonical
      ? {
          canonical,
          languages: {
            de: `${siteInfo.url}/de${normalizedPath}`,
            en: `${siteInfo.url}/en${normalizedPath}`,
            "x-default": `${siteInfo.url}/de${normalizedPath}`,
          },
        }
      : undefined,
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
