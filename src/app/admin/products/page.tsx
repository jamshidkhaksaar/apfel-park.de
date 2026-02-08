import { createClient } from "@/lib/supabase/server";
import { getAdminDictionary, getAdminNumberLocale } from "@/lib/admin-i18n-server";
import Link from "next/link";
import AdminShell from "../../../components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();
  const dict = await getAdminDictionary();
  const numberLocale = await getAdminNumberLocale();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const getCategoryLabel = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized === "smartphone" || normalized === "smartphones") return dict.productsPage.categories.smartphones;
    if (normalized === "accessory" || normalized === "accessories") return dict.productsPage.categories.accessories;
    if (normalized === "console" || normalized === "consoles" || normalized === "gaming") return dict.productsPage.categories.consoles;
    if (normalized === "laptop" || normalized === "laptops") return dict.productsPage.categories.laptops;
    return dict.productsPage.categories.unknown;
  };

  return (
    <AdminShell title={dict.productsPage.title}>
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {dict.productsPage.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {dict.productsPage.heading}
            </h2>
          </div>
          <Link 
            href="/admin/products/new"
            className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black hover:bg-gold-deep transition"
          >
            {dict.productsPage.create}
          </Link>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">{dict.productsPage.table.product}</th>
                <th className="px-4 py-3">{dict.productsPage.table.status}</th>
                <th className="px-4 py-3">{dict.productsPage.table.category}</th>
                <th className="px-4 py-3">{dict.productsPage.table.stock}</th>
                <th className="px-4 py-3">{dict.productsPage.table.price}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products && products.length > 0 ? (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                          {dict.productsPage.status.active}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                          {dict.productsPage.status.draft}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{getCategoryLabel(item.category)}</td>
                    <td className="px-4 py-3 text-muted">{item.stock}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Intl.NumberFormat(numberLocale, {
                        style: "currency",
                        currency: "EUR",
                      }).format(item.price)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    {dict.productsPage.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
