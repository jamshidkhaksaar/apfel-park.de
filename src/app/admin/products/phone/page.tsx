import { notFound } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import SmartphoneWizard from '@/components/admin/SmartphoneWizard';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { phoneEditorEnabled } from '@/lib/smartphone-editor/http';
import { phoneEditorText } from '@/lib/smartphone-editor/i18n';
export const dynamic = 'force-dynamic';
export default async function PhonePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  if (!phoneEditorEnabled()) notFound();
  const [locale, params] = await Promise.all([getAdminLocale(), searchParams]);
  return (
    <AdminShell title={phoneEditorText[locale].title}>
      <SmartphoneWizard
        researchEnabled={process.env.LEGACY_PRODUCT_RESEARCH_ENABLED === 'true'}
        locale={locale}
        productId={params.product}
      />
    </AdminShell>
  );
}
