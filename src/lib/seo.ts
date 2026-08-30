import type { MetadataRoute } from "next";

import { createAdminDbClient } from "@/lib/admin-db";
import { locales, type Locale } from "@/lib/i18n";
import { accessoryCollectionSlugs, getAccessoryCollection } from "@/lib/accessory-collections";
import { countActiveSubcategoryProducts, getProducts } from "@/lib/products";
import { repairServiceSlugs } from "@/lib/repair-services";
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
  const products = await getProducts().catch(() => []);
  const stockedCategories = new Set(products.map((product) => product.category));
  const categoryRoutes: Partial<Record<SeoRouteId, string>> = {
    smartphones: "smartphones",
    tablets: "tablets",
    accessories: "accessories",
    laptops: "laptops",
    gaming: "consoles",
  };

  const staticEntries = seoRouteDefinitions.flatMap((route) => {
    const pageSettings = settings.pages[route.id];
    if (!pageSettings.index) return [];

    const category = categoryRoutes[route.id];
    if (category && !stockedCategories.has(category as (typeof products)[number]["category"])) return [];

    return locales.map((locale) => ({
      url: `${siteInfo.url}/${locale}${route.path}`,
      alternates: {
        languages: {
          de: `${siteInfo.url}/de${route.path}`,
          en: `${siteInfo.url}/en${route.path}`,
          "x-default": `${siteInfo.url}/de${route.path}`,
        },
      },
    }));
  });

  const productEntries = products.flatMap((product) => {
    // updated_at, not created_at: a price, stock or content edit has to move
    // the sitemap lastmod or crawlers keep the stale copy.
    const stamp = product.updatedAt ?? product.createdAt;
    const changedAt = stamp ? new Date(stamp) : null;
    const lastModified = changedAt && !Number.isNaN(changedAt.getTime()) ? changedAt : undefined;

    return locales.map((locale) => ({
      url: `${siteInfo.url}/${locale}/store/${product.slug}`,
      lastModified,
      alternates: {
        languages: {
          de: `${siteInfo.url}/de/store/${product.slug}`,
          en: `${siteInfo.url}/en/store/${product.slug}`,
          "x-default": `${siteInfo.url}/de/store/${product.slug}`,
        },
      },
    }));
  });

  // Skip subcategories with nothing sellable; those pages are noindexed, so
  // listing them would advertise thin content.
  const stockedCollectionSlugs = (
    await Promise.all(
      accessoryCollectionSlugs.map(async (slug) => {
        const copy = getAccessoryCollection(slug, "de");
        if (!copy) return null;
        return (await countActiveSubcategoryProducts(copy.subcategory)) > 0 ? slug : null;
      }),
    )
  ).filter((slug): slug is string => slug !== null);

  const accessoryCollectionEntries = stockedCollectionSlugs.flatMap((slug) =>
    locales.map((locale) => ({
      url: `${siteInfo.url}/${locale}/accessories/${slug}`,
      alternates: {
        languages: {
          de: `${siteInfo.url}/de/accessories/${slug}`,
          en: `${siteInfo.url}/en/accessories/${slug}`,
          "x-default": `${siteInfo.url}/de/accessories/${slug}`,
        },
      },
    })),
  );

  const repairServiceEntries = repairServiceSlugs.flatMap((service) =>
    locales.map((locale) => ({
      url: `${siteInfo.url}/${locale}/repairs/${service}`,
      alternates: {
        languages: {
          de: `${siteInfo.url}/de/repairs/${service}`,
          en: `${siteInfo.url}/en/repairs/${service}`,
          "x-default": `${siteInfo.url}/de/repairs/${service}`,
        },
      },
    })),
  );

  const catalogEntries = locales.map((locale) => ({
    url: `${siteInfo.url}/${locale}/store/catalog`,
    alternates: {
      languages: {
        de: `${siteInfo.url}/de/store/catalog`,
        en: `${siteInfo.url}/en/store/catalog`,
        "x-default": `${siteInfo.url}/de/store/catalog`,
      },
    },
  }));

  const guideEntries = locales.map((locale) => ({
    url: `${siteInfo.url}/${locale}/ratgeber/smartphone-laenger-nutzen`,
    alternates: {
      languages: {
        de: `${siteInfo.url}/de/ratgeber/smartphone-laenger-nutzen`,
        en: `${siteInfo.url}/en/ratgeber/smartphone-laenger-nutzen`,
        "x-default": `${siteInfo.url}/de/ratgeber/smartphone-laenger-nutzen`,
      },
    },
  }));

  const repairComparisonEntries = locales.map((locale) => ({
    url: `${siteInfo.url}/${locale}/repairs/preisvergleich-hamburg`,
    lastModified: new Date("2026-08-29T00:00:00+02:00"),
    alternates: {
      languages: {
        de: `${siteInfo.url}/de/repairs/preisvergleich-hamburg`,
        en: `${siteInfo.url}/en/repairs/preisvergleich-hamburg`,
        "x-default": `${siteInfo.url}/de/repairs/preisvergleich-hamburg`,
      },
    },
  }));

  return [...staticEntries, ...repairServiceEntries, ...repairComparisonEntries, ...accessoryCollectionEntries, ...catalogEntries, ...guideEntries, ...productEntries];
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
        allow: ["/", "/api/meta/catalog.csv", "/google-merchant.xml", "/google-local-inventory.txt", "/llms.txt"],
        disallow: ["/admin", "/api/"],
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
