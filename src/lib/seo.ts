import type { MetadataRoute } from "next";

import { createAdminDbClient } from "@/lib/admin-db";
import { locales, type Locale } from "@/lib/i18n";
import { getProducts } from "@/lib/products";
import {
  buildDefaultSeoSettings,
  getSeoRouteIdByPath,
  seoRouteDefinitions,
  splitKeywords,
  type SeoChangeFrequency,
  type SeoPageSettings,
  type SeoRouteId,
  type SeoSettings,
} from "@/lib/seo-shared";
import { siteInfo } from "@/lib/site";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const parseString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const parsePriority = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
};

const parseChangeFrequency = (
  value: unknown,
  fallback: SeoChangeFrequency,
): SeoChangeFrequency => {
  const allowed = new Set<SeoChangeFrequency>([
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never",
  ]);
  return typeof value === "string" && allowed.has(value as SeoChangeFrequency)
    ? (value as SeoChangeFrequency)
    : fallback;
};

const normalizeSettings = (input: unknown): SeoSettings => {
  const defaults = buildDefaultSeoSettings();
  if (!isObject(input)) return defaults;

  const globalInput = isObject(input.global) ? input.global : {};
  const pagesInput = isObject(input.pages) ? input.pages : {};

  return {
    global: {
      defaultOgImage: parseString(globalInput.defaultOgImage, defaults.global.defaultOgImage),
      googleVerification: parseString(globalInput.googleVerification, defaults.global.googleVerification),
      bingVerification: parseString(globalInput.bingVerification, defaults.global.bingVerification),
      enableSitemap: parseBoolean(globalInput.enableSitemap, defaults.global.enableSitemap),
      enableRobots: parseBoolean(globalInput.enableRobots, defaults.global.enableRobots),
      forceCanonical: parseBoolean(globalInput.forceCanonical, defaults.global.forceCanonical),
      defaultKeywords: {
        de: parseString(
          isObject(globalInput.defaultKeywords) ? globalInput.defaultKeywords.de : undefined,
          defaults.global.defaultKeywords.de,
        ),
        en: parseString(
          isObject(globalInput.defaultKeywords) ? globalInput.defaultKeywords.en : undefined,
          defaults.global.defaultKeywords.en,
        ),
      },
    },
    pages: seoRouteDefinitions.reduce(
      (acc, route) => {
        const routeInput: Record<string, unknown> = isObject(pagesInput[route.id])
          ? (pagesInput[route.id] as Record<string, unknown>)
          : {};
        const localesInput: Record<string, unknown> = isObject(routeInput.locales)
          ? (routeInput.locales as Record<string, unknown>)
          : {};

        acc[route.id] = {
          index: parseBoolean(routeInput.index, defaults.pages[route.id].index),
          priority: parsePriority(routeInput.priority, defaults.pages[route.id].priority),
          changeFrequency: parseChangeFrequency(
            routeInput.changeFrequency,
            defaults.pages[route.id].changeFrequency,
          ),
          locales: {
            de: {
              title: parseString(
                isObject(localesInput.de) ? localesInput.de.title : undefined,
                defaults.pages[route.id].locales.de.title,
              ),
              description: parseString(
                isObject(localesInput.de) ? localesInput.de.description : undefined,
                defaults.pages[route.id].locales.de.description,
              ),
              keywords: parseString(
                isObject(localesInput.de) ? localesInput.de.keywords : undefined,
                defaults.pages[route.id].locales.de.keywords,
              ),
            },
            en: {
              title: parseString(
                isObject(localesInput.en) ? localesInput.en.title : undefined,
                defaults.pages[route.id].locales.en.title,
              ),
              description: parseString(
                isObject(localesInput.en) ? localesInput.en.description : undefined,
                defaults.pages[route.id].locales.en.description,
              ),
              keywords: parseString(
                isObject(localesInput.en) ? localesInput.en.keywords : undefined,
                defaults.pages[route.id].locales.en.keywords,
              ),
            },
          },
        };
        return acc;
      },
      {} as Record<SeoRouteId, SeoPageSettings>,
    ),
  };
};

export const getSeoSettings = async (): Promise<SeoSettings> => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "seo_settings")
      .maybeSingle();

    return normalizeSettings(data?.value);
  } catch {
    return buildDefaultSeoSettings();
  }
};

export const resolveSeoPage = async (routeId: SeoRouteId, locale: Locale) => {
  const settings = await getSeoSettings();
  const route = settings.pages[routeId];
  return {
    global: settings.global,
    route,
    metadata: route.locales[locale],
  };
};

export const getSitemapEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const settings = await getSeoSettings();
  if (!settings.global.enableSitemap) return [];

  const now = new Date();

  const staticEntries = seoRouteDefinitions.flatMap((route) => {
    const pageSettings = settings.pages[route.id];
    if (!pageSettings.index) return [];

    return locales.map((locale) => ({
      url: `${siteInfo.url}/${locale}${route.path}`,
      lastModified: now,
      changeFrequency: pageSettings.changeFrequency,
      priority: pageSettings.priority,
      alternates: {
        languages: {
          de: `${siteInfo.url}/de${route.path}`,
          en: `${siteInfo.url}/en${route.path}`,
          "x-default": `${siteInfo.url}/de${route.path}`,
        },
      },
    }));
  });

  const products = await getProducts().catch(() => []);
  const productEntries = products.flatMap((product) =>
    locales.map((locale) => ({
      url: `${siteInfo.url}/${locale}/store/${product.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: product.isFeatured ? 0.85 : 0.72,
      alternates: {
        languages: {
          de: `${siteInfo.url}/de/store/${product.slug}`,
          en: `${siteInfo.url}/en/store/${product.slug}`,
          "x-default": `${siteInfo.url}/de/store/${product.slug}`,
        },
      },
    })),
  );

  return [...staticEntries, ...productEntries];
};

export const getRobotsConfig = async (): Promise<MetadataRoute.Robots> => {
  const settings = await getSeoSettings();
  const common = {
    host: siteInfo.url,
    sitemap: settings.global.enableSitemap ? `${siteInfo.url}/sitemap.xml` : undefined,
  };

  if (!settings.global.enableRobots) {
    return {
      ...common,
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    ...common,
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/meta/catalog.csv"],
        disallow: ["/admin", "/login", "/api/"],
      },
    ],
  };
};

export {
  buildDefaultSeoSettings,
  getSeoRouteIdByPath,
  seoRouteDefinitions,
  splitKeywords,
};
export type {
  SeoChangeFrequency,
  SeoGlobalSettings,
  SeoLocaleFields,
  SeoPageSettings,
  SeoRouteDefinition,
  SeoRouteId,
  SeoSettings,
} from "@/lib/seo-shared";
