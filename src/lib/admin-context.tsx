"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import Cookies from "js-cookie";
import { adminDictionary, type AdminDictionary, type AdminLocale } from "./admin-i18n";

type AdminUser = {
  email: string;
  role: string;
} | null;

type AdminContextType = {
  lang: AdminLocale;
  setLang: (lang: AdminLocale) => void;
  dict: AdminDictionary;
  user: AdminUser;
};

const AdminContext = createContext<AdminContextType | null>(null);

const ADMIN_LANG_EVENT = "admin-lang-change";

const getStoredAdminLang = (): AdminLocale => {
  const savedLang = Cookies.get("admin-lang");
  return savedLang === "de" || savedLang === "en" ? savedLang : "de";
};

const subscribeToAdminLang = (onStoreChange: () => void) => {
  window.addEventListener(ADMIN_LANG_EVENT, onStoreChange);
  return () => window.removeEventListener(ADMIN_LANG_EVENT, onStoreChange);
};

export function AdminProvider({
  children,
  user,
}: {
  children: ReactNode;
  user?: AdminUser;
}) {
  const lang = useSyncExternalStore<AdminLocale>(
    subscribeToAdminLang,
    getStoredAdminLang,
    () => "de",
  );

  const setLang = (newLang: AdminLocale) => {
    Cookies.set("admin-lang", newLang, { expires: 365 });
    window.dispatchEvent(new Event(ADMIN_LANG_EVENT));
  };

  return (
    <AdminContext.Provider value={{ lang, setLang, dict: adminDictionary[lang], user: user ?? null }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
