import { cookies } from "next/headers";

import { adminDictionary, type AdminDictionary, type AdminLocale } from "./admin-i18n";

export const getAdminLocale = async (): Promise<AdminLocale> => {
  const cookieStore = await cookies();
  const lang = cookieStore.get("admin-lang")?.value;
  return lang === "en" ? "en" : "de";
};

export const getAdminDictionary = async (): Promise<AdminDictionary> => {
  const locale = await getAdminLocale();
  return adminDictionary[locale];
};

export const getAdminNumberLocale = async (): Promise<string> => {
  const locale = await getAdminLocale();
  return locale === "en" ? "en-US" : "de-DE";
};
