import AdminShell from "@/components/admin/AdminShell";
import AdminInventoryManager from "@/components/admin/AdminInventoryManager";
import { canManageProducts } from "@/lib/admin-auth";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { getOperationsAccess } from "@/lib/operations/access";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [locale, user] = await Promise.all([getAdminLocale(), readSessionUser()]);
  const access = await getOperationsAccess(user);
  return (
    <AdminShell title={locale === "de" ? "Lager" : "Inventory"}>
      <AdminInventoryManager
        locale={locale}
        canManage={canManageProducts(user)}
        canPrintLabels={Boolean(access?.owner)}
        canViewReports={Boolean(access?.owner)}
      />
    </AdminShell>
  );
}
