import type { Metadata } from "next";

import { siteInfo } from "./site";
import type { Locale } from "./i18n";

const normalizePath = (path: string) => {
  if (!path) {
    return "";
  }
  return path.startsWith("/") ? path : `/${path}`;
};

export const createMetadata = (
  locale: Locale,
  title: string,
  description: string,
  path: string,
): Metadata => {
  const normalizedPath = normalizePath(path);
  const pathWithLocale = `/${locale}${normalizedPath}`;
  const canonical = `${siteInfo.url}${pathWithLocale}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        de: `${siteInfo.url}/de${normalizedPath}`,
        en: `${siteInfo.url}/en${normalizedPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: siteInfo.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
};
