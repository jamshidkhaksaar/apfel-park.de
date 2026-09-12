

import AdminShell from "../../../../components/admin/AdminShell";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { adminDictionary } from "@/lib/admin-i18n";
import SmartphoneWizard from "@/components/admin/SmartphoneWizard";
import { phoneEditorEnabled } from "@/lib/smartphone-editor/http";
import Link from "next/link";

import ProductCreateForm from "./product-create-form";

export default async function NewProductPage({searchParams}:{searchParams:Promise<{legacy?:string}>}) {
  const locale=await getAdminLocale();
  const dict=adminDictionary[locale];
  const legacy=(await searchParams).legacy === "1";
  if(phoneEditorEnabled()&&!legacy)return <AdminShell title={dict.newProductPage.title}><SmartphoneWizard researchEnabled={process.env.LEGACY_PRODUCT_RESEARCH_ENABLED === "true"} locale={locale}/><Link className="text-gold" href="/admin/products/new?legacy=1">{locale==="de"?"Andere Produktkategorien":"Other product categories"}</Link></AdminShell>;

  return (
    <AdminShell title={dict.newProductPage.title}>
      <div className="glass-panel rounded-2xl p-6">
        <p className="text-sm text-muted">{dict.newProductPage.description}</p>
        <div className="mt-6">
          <ProductCreateForm />
        </div>
      </div>
    </AdminShell>
  );
}
