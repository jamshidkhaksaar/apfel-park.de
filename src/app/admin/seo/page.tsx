import AdminShell from "@/components/admin/AdminShell";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { getSeoSettings } from "@/lib/seo";

import SeoAdminForm from "./SeoAdminForm";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  const dict = await getAdminDictionary();
  const adminLocale = await getAdminLocale();
  const seoSettings = await getSeoSettings();

  return (
    <AdminShell title={dict.seoPage.title}>
      <SeoAdminForm initialSettings={seoSettings} adminLang={adminLocale} />
    </AdminShell>
  );
}
