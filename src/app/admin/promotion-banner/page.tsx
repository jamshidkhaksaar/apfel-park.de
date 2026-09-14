import AdminShell from '@/components/admin/AdminShell';
import AdminPromotionBanner from '@/components/admin/AdminPromotionBanner';
import { getAdminLocale } from '@/lib/admin-i18n-server';
export default async function PromotionBannerPage(){
  const locale=await getAdminLocale();
  return <AdminShell title={locale==='de'?'Aktionsbanner':'Promotion banner'}><div className="mx-auto w-full max-w-[1500px]"><AdminPromotionBanner locale={locale}/></div></AdminShell>;
}
