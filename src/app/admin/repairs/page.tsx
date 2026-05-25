import { createAdminServerClient } from "@/lib/admin-auth-server";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { getRepairCatalog } from "@/lib/repair-catalog";

import AdminShell from "../../../components/admin/AdminShell";
import AdminRepairsWorkspace from "../../../components/admin/AdminRepairsWorkspace";

export const dynamic = "force-dynamic";

type RepairRow = {
  id: string;
  ticket_number: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_locale: string | null;
  device_model: string;
  issue_description: string | null;
  status: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  repair_summary: string | null;
  notes: string | null;
  created_at: string;
};

export default async function RepairsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const adminClient = await createAdminServerClient();
  const dict = await getAdminDictionary();
  const locale = await getAdminLocale();
  const catalog = await getRepairCatalog();
  const params = (await searchParams) ?? {};

  const { data } = await adminClient
    .from("repairs")
    .select(
      "id,ticket_number,customer_name,customer_email,customer_phone,customer_locale,device_model,issue_description,status,estimated_cost,final_cost,repair_summary,notes,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const repairs = (data ?? []) as RepairRow[];
  const openRepairs = repairs.filter(
    (repair) => !["completed", "cancelled"].includes((repair.status ?? "").toLowerCase()),
  ).length;

  return (
    <AdminShell title={dict.repairsPage.title}>
      <AdminRepairsWorkspace
        locale={locale}
        repairsPage={dict.repairsPage}
        repairs={repairs}
        catalog={catalog}
        openRepairs={openRepairs}
        showSuccess={params.updated === "1"}
        showEmailWarning={params.email === "warning"}
      />
    </AdminShell>
  );
}
