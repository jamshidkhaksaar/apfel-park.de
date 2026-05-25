import { createAdminDbClient } from "@/lib/admin-db";
import { getDictionary, type Locale } from "@/lib/i18n";

type DeepValue = Record<string, unknown> | string | number | boolean | null | undefined | DeepValue[];

function isRecord(value: DeepValue): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeDeep<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  if (!isRecord(override)) {
    return base;
  }

  const baseRecord: Record<string, unknown> = isRecord(base) ? base : {};
  const result: Record<string, unknown> = { ...baseRecord };

  for (const key of Object.keys(override)) {
    const overrideValue = override[key] as DeepValue;
    const baseValue = (baseRecord[key] as DeepValue) ?? undefined;

    if (Array.isArray(overrideValue)) {
      if (
        Array.isArray(baseValue) &&
        overrideValue.every((item) => isRecord(item)) &&
        baseValue.every((item) => isRecord(item))
      ) {
        result[key] = overrideValue.map((item, index) =>
          mergeDeep((baseValue[index] as Record<string, unknown>) ?? {}, item as Record<string, unknown>)
        );
      } else {
        result[key] = overrideValue;
      }
    } else if (isRecord(overrideValue)) {
      result[key] = mergeDeep(isRecord(baseValue) ? baseValue : {}, overrideValue);
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }

  return result as T;
}

async function fetchContentKey(key: string): Promise<Record<string, unknown> | null> {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", key)
      .single();
    return (data?.value as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

export async function getHomeContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_home");
  if (!db) return dict.home;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.home, langDb);
}

export async function getAboutContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_about");
  if (!db) return dict.about;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.about, langDb);
}

export async function getRepairsContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_repairs");
  if (!db) return dict.repairs;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.repairs, langDb);
}

export async function getContactContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_contact");
  if (!db) return dict.contact;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.contact, langDb);
}

export async function getFaqContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_faq");
  if (!db) return dict.faq;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.faq, langDb);
}

export async function getSmartphonesContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_smartphones");
  if (!db) return dict.smartphones;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.smartphones, langDb);
}

export async function getAccessoriesContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_accessories");
  if (!db) return dict.accessories;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.accessories, langDb);
}

export async function getGamingContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_gaming");
  if (!db) return dict.gaming;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.gaming, langDb);
}

export async function getLaptopsContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_laptops");
  if (!db) return dict.laptops;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.laptops, langDb);
}

export async function getPrivacyContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_privacy");
  if (!db) return dict.privacy;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.privacy, langDb);
}

export async function getTermsContent(lang: Locale) {
  const dict = getDictionary(lang);
  const db = await fetchContentKey("content_terms");
  if (!db) return dict.terms;
  const langDb = (db[lang] as Record<string, unknown>) ?? {};
  return mergeDeep(dict.terms, langDb);
}
