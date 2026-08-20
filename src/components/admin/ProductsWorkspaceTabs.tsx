import Link from "next/link";
import type { ReactNode } from "react";

import { adminDictionary } from "@/lib/admin-i18n";
import { type ProductIntakeWorkspaceView } from "@/lib/product-intake/workspace-constants";

export default function ProductsWorkspaceTabs({
  locale,
  view,
  query,
  children,
}: {
  locale: "de" | "en";
  view: ProductIntakeWorkspaceView;
  query: string;
  children: ReactNode;
}) {
  const copy = adminDictionary[locale].productsWorkspace;
  const hrefFor = (next: ProductIntakeWorkspaceView) => {
    const params = new URLSearchParams(query);
    if (next === "catalog") params.delete("view");
    else params.set("view", next);
    params.delete("page");
    const encoded = params.toString();
    return encoded ? `/admin/products?${encoded}` : "/admin/products";
  };
  const tabs: Array<{ id: ProductIntakeWorkspaceView; label: string }> = [
    { id: "catalog", label: copy.catalogTab },
    { id: "intake", label: copy.intakeTab },
    { id: "history", label: copy.historyTab },
  ];
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4">
      <nav aria-label={copy.tabsLabel} className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            prefetch={false}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              view === tab.id ? "bg-gold text-black" : "border border-border/60 text-muted hover:border-gold/40 hover:text-gold"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
