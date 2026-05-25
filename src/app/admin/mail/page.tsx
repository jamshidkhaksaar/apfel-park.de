import AdminShell from "../../../components/admin/AdminShell";
import AdminMailWorkspace from "../../../components/admin/AdminMailWorkspace";

import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { listMailboxes } from "@/lib/mail-admin";

export const dynamic = "force-dynamic";

export default async function AdminMailPage() {
  const [dict, locale, mailboxes] = await Promise.all([
    getAdminDictionary(),
    getAdminLocale(),
    listMailboxes(),
  ]);

  return (
    <AdminShell title={dict.mailPage.title}>
      <AdminMailWorkspace locale={locale} mailPage={dict.mailPage} mailboxes={mailboxes} />
    </AdminShell>
  );
}
