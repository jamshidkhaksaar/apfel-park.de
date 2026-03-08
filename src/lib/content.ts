import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, type Locale } from "@/lib/i18n";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeDeep(base: any, override: any): any {
  if (!override || typeof override !== "object" || Array.isArray(override)) {
    return override !== undefined ? override : base;
  }
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (Array.isArray(override[key])) {
      result[key] = override[key];
    } else if (typeof override[key] === "object" && override[key] !== null) {
      result[key] = mergeDeep(base?.[key] ?? {}, override[key]);
    } else if (override[key] !== undefined) {
      result[key] = override[key];
    }
  }
  return result;
}

async function fetchContentKey(key: string): Promise<Record<string, unknown> | null> {
  try {
    const admin = createAdminClient();
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
