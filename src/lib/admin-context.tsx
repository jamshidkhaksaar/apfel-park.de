"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Cookies from "js-cookie";
import { adminDictionary, type AdminDictionary, type AdminLocale } from "./admin-i18n";

type AdminContextType = {
  lang: AdminLocale;
  setLang: (lang: AdminLocale) => void;
  dict: AdminDictionary;
};

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLocale>(() => {
    const savedLang = Cookies.get("admin-lang") as AdminLocale | undefined;
    if (savedLang === "de" || savedLang === "en") {
      return savedLang;
    }
    return "de";
  });

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
