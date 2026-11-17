"use client";

import { useAdminSidebar } from "@/lib/admin-sidebar";

/** Collapses the admin sidebar to icons so wide product tables get the room. */
export default function SidebarSpaceToggle({ locale }: { locale: "de" | "en" }) {
  const [collapsed, toggle] = useAdminSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={collapsed}
      className="hidden rounded-xl border border-border/60 px-3 py-1.5 text-sm font-medium text-muted transition hover:border-gold/40 hover:text-foreground lg:inline-flex"
    >
      {collapsed ? (locale === "de" ? "⇥ Seitenleiste zeigen" : "⇥ Show sidebar") : locale === "de" ? "⇤ Mehr Platz" : "⇤ More space"}
    </button>
  );
}
