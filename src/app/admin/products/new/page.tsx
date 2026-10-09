import { notFound } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import SmartphoneWizard from '@/components/admin/SmartphoneWizard';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { adminDictionary } from '@/lib/admin-i18n';
import { phoneEditorEnabled } from '@/lib/smartphone-editor/http';
export default async function NewProductPage() {
  if (!phoneEditorEnabled()) notFound();
  const locale = await getAdminLocale();
  return <AdminShell title={adminDictionary[locale].newProductPage.title}><SmartphoneWizard locale={locale} researchEnabled={process.env.LEGACY_PRODUCT_RESEARCH_ENABLED === 'true'} /></AdminShell>;
}
