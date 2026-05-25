import AdminShell from "../../../components/admin/AdminShell";
import AdminChatWorkspace from "../../../components/admin/AdminChatWorkspace";

import { getAdminLocale } from "@/lib/admin-i18n-server";
import { listAdminConversations } from "@/lib/chat";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const [locale, conversations] = await Promise.all([
    getAdminLocale(),
    listAdminConversations(),
  ]);

  const title = locale === "de" ? "Kundenchat" : "Customer Chat";

  return (
    <AdminShell title={title}>
      <AdminChatWorkspace locale={locale} initialConversations={conversations} />
    </AdminShell>
  );
}
