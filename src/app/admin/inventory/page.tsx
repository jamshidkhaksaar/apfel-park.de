import AdminShell from "@/components/admin/AdminShell";
import AdminInventoryManager from "@/components/admin/AdminInventoryManager";
import { getAdminLocale } from "@/lib/admin-i18n-server";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const locale = await getAdminLocale();
  return (
    <AdminShell title={locale === "de" ? "Lager" : "Inventory"}>
      <AdminInventoryManager locale={locale} />
    </AdminShell>
  );
}
