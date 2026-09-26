import { notFound } from 'next/navigation';
import Link from 'next/link';
import { adminListReturnTo } from '@/lib/admin-list-navigation';
import AdminShell from '@/components/admin/AdminShell';
import SmartphoneWizard from '@/components/admin/SmartphoneWizard';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { phoneEditorEnabled } from '@/lib/smartphone-editor/http';
import { phoneEditorText } from '@/lib/smartphone-editor/i18n';
export const dynamic = 'force-dynamic';
export default async function PhonePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; returnTo?: string }>;
}) {
  if (!phoneEditorEnabled()) notFound();
  const [locale, params] = await Promise.all([getAdminLocale(), searchParams]);
  const returnHref = adminListReturnTo(params.returnTo);
  return (
    <AdminShell title={phoneEditorText[locale].title}>
      <Link href={returnHref} scroll={false} className="mb-4 inline-flex text-sm text-gold">← {returnHref.startsWith("/admin/inventory") ? (locale === "de" ? "Zurück zum Lager" : "Back to inventory") : (locale === "de" ? "Zurück zum Produktkatalog" : "Back to product catalog")}</Link>
      <SmartphoneWizard
        researchEnabled={process.env.LEGACY_PRODUCT_RESEARCH_ENABLED === 'true'}
        locale={locale}
        productId={params.product}
      />
    </AdminShell>
  );
}
