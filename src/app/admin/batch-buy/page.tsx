import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import AdminBatchBuyWorkspace from "@/components/admin/AdminBatchBuyWorkspace";
import { canManageBatchBuy } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { listBatchPhones, listBatchSellers } from "@/lib/batch-buy";
import { getRepairCatalog } from "@/lib/repair-catalog";

export const dynamic = "force-dynamic";

export default async function BatchBuyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!canManageBatchBuy(user)) {
    redirect("/admin");
  }

  const dict = await getAdminDictionary();
  const locale = await getAdminLocale();
  const catalog = await getRepairCatalog();
  const [sellers, phones] = await Promise.all([listBatchSellers(), listBatchPhones()]);
  const params = (await searchParams) ?? {};
  const selectedSellerId =
    typeof params.seller === "string" && sellers.some((seller) => seller.id === params.seller)
      ? params.seller
      : sellers[0]?.id ?? null;

  return (
    <AdminShell title={dict.batchBuyPage.title}>
      <AdminBatchBuyWorkspace
        locale={locale}
        pageText={dict.batchBuyPage}
        sellers={sellers}
        phones={phones}
        catalog={catalog}
        selectedSellerId={selectedSellerId}
        saved={typeof params.saved === "string" ? params.saved : null}
        error={typeof params.error === "string" ? params.error : null}
      />
    </AdminShell>
  );
}
