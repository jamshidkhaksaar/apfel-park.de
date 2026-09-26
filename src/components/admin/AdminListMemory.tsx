"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { adminListReturnTo } from "@/lib/admin-list-navigation";

const comparableHref = (href: string): string => {
  const url = new URL(adminListReturnTo(href), "https://admin.local");
  for (const [key, value] of [...url.searchParams]) {
    if (!value.trim() || (key === "page" && value === "1") ||
      (url.pathname === "/admin/inventory" && (key === "status" || key === "stock") && value === "all") ||
      (url.pathname === "/admin/products" && key === "sort" && value === "newest")) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return `${url.pathname}?${url.searchParams}`;
};

export default function AdminListMemory({ path, ready = true }: {
  path: "/admin/products" | "/admin/inventory";
  ready?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams().toString();
  useEffect(() => {
    const key = `apfel-admin-list:${path}`;
    const href = search ? `${path}?${search}` : path;
    let previous: { href: string; scroll: number } | null = null;
    try { previous = JSON.parse(sessionStorage.getItem(key) || "null"); } catch { /* Storage is optional. */ }
    if (!search && previous?.href && adminListReturnTo(previous.href).startsWith(`${path}?`)) {
      router.replace(previous.href, { scroll: false });
      return;
    }
    if (!ready) return;
    try {
      const dirtyKey = `apfel-admin-list-dirty:${path}`;
      if (sessionStorage.getItem(dirtyKey)) {
        sessionStorage.removeItem(dirtyKey);
        if (path === "/admin/products") router.refresh();
      }
    } catch { /* Storage is optional. */ }
    const savedScroll = previous?.href && comparableHref(previous.href) === comparableHref(href)
      && Number.isFinite(previous.scroll) ? previous.scroll : 0;
    let restored = false;
    const save = () => {
      if (!restored) return;
      try { sessionStorage.setItem(key, JSON.stringify({ href, scroll: window.scrollY })); } catch { /* Storage is optional. */ }
    };
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (savedScroll > 0) window.scrollTo({ top: savedScroll, behavior: "instant" });
        restored = true;
        save();
      });
    });
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("pagehide", save);
    document.addEventListener("click", save, true);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(secondFrame);
      window.removeEventListener("scroll", save);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("click", save, true);
    };
  }, [path, search, router, ready]);
  return null;
}
