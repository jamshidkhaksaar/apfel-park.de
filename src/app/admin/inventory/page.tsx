import AdminShell from "@/components/admin/AdminShell";
import AdminInventoryManager from "@/components/admin/AdminInventoryManager";
import UnderConstruction from "@/components/admin/UnderConstruction";
import { canManageProducts, canRecordShopSale } from "@/lib/admin-auth";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { getOperationsAccess } from "@/lib/operations/access";
import { readSessionUser } from "@/lib/session";
import { TILL_INVENTORY_UNDER_CONSTRUCTION } from "@/lib/admin-maintenance";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const locale = await getAdminLocale();
  if (TILL_INVENTORY_UNDER_CONSTRUCTION) {
    return (
      <AdminShell title={locale === "de" ? "Lager" : "Inventory"}>
        <UnderConstruction locale={locale} />
      </AdminShell>
    );
  }
  const user = await readSessionUser();
  const access = await getOperationsAccess(user);
  return (
    <AdminShell title={locale === "de" ? "Lager" : "Inventory"}>
      <AdminInventoryManager
        locale={locale}
        canManage={canManageProducts(user)}
        canPrintLabels={Boolean(access?.owner)}
        canViewReports={Boolean(access?.owner)}
        canSellInShop={canRecordShopSale(user)}
      />
    </AdminShell>
  );
}
