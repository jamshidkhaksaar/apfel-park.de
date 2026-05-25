import { getAdminDictionary } from "@/lib/admin-i18n-server";

import AdminShell from "../../../components/admin/AdminShell";
import AdminHealthWorkspace from "../../../components/admin/AdminHealthWorkspace";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const dict = await getAdminDictionary();

  return (
    <AdminShell title={dict.healthPage.title}>
      <AdminHealthWorkspace dict={dict.healthPage} />
    </AdminShell>
  );
}
