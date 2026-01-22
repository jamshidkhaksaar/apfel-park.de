"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Cookies from "js-cookie";
import { adminDictionary, type AdminLocale } from "./admin-i18n";

type AdminContextType = {
  lang: AdminLocale;
  setLang: (lang: AdminLocale) => void;
  dict: typeof adminDictionary.de;
};

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLocale>("de");

  useEffect(() => {
    // Load from cookie or default to 'de'
    const savedLang = Cookies.get("admin-lang") as AdminLocale;
    if (savedLang && (savedLang === "de" || savedLang === "en")) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: AdminLocale) => {
    setLangState(newLang);
    Cookies.set("admin-lang", newLang, { expires: 365 });
  };

  return (
    <AdminContext.Provider value={{ lang, setLang, dict: adminDictionary[lang] }}>
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
