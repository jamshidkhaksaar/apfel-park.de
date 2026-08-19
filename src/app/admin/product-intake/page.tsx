import { redirect } from "next/navigation";

import AdminProductIntakeQueue from "@/components/admin/AdminProductIntakeQueue";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { adminDictionary } from "@/lib/admin-i18n";
import { createPreviewToken } from "@/lib/product-intake/preview-token";
import { createIntakeAssetToken } from "@/lib/product-intake/asset-token";
import { isProductIntakeOwner } from "@/lib/product-intake/owner";
import { getProductIntakeRunDetail, listProductIntakeRuns } from "@/lib/product-intake/repository";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProductIntakeAdminPage() {
  const user = await readSessionUser();
  if (!isProductIntakeOwner(user)) redirect("/admin");
  const [locale, runs] = await Promise.all([getAdminLocale(), listProductIntakeRuns(200)]);
  const copy = adminDictionary[locale].productIntakePage;
  const liveEnabled = process.env.PRODUCT_INTAKE_LIVE_ENABLED === "true"
    && process.env.PRODUCT_INTAKE_DEFAULT_MODE === "live";
  const loadedDetail = runs[0] ? await getProductIntakeRunDetail(runs[0].id) : null;
  const secret = process.env.PRODUCT_INTAKE_PREVIEW_SECRET?.trim() ?? "";
  const assetSecret = process.env.PRODUCT_INTAKE_ASSET_SECRET?.trim() ?? "";
  const detail = loadedDetail && assetSecret.length >= 32
    ? {
        ...loadedDetail,
        assets: loadedDetail.assets.map((asset) => {
          if (asset.containsSensitiveIdentifiers) return asset;
          const signed = createIntakeAssetToken({ assetKey: asset.assetKey, sha256: asset.sha256 }, assetSecret);
          return {
            ...asset,
            visionUrl: `/api/integrations/product-intake/assets/${signed.token}`,
            visionExpiresAt: signed.expiresAt,
          };
        }),
      }
    : loadedDetail;
  const preview = detail?.run.proposalHash && secret.length >= 32
    ? createPreviewToken({ runId: detail.run.id, proposalHash: detail.run.proposalHash }, secret)
    : null;

  return (
    <AdminShell title={copy.title}>
      <div className="mx-auto w-full max-w-[1500px]">
        <div className={`mb-5 rounded-2xl border p-4 ${liveEnabled ? "border-red-500/30 bg-red-500/5" : "border-amber-500/25 bg-amber-500/5"}`}>
          <p className="font-semibold text-foreground">{liveEnabled ? copy.pipelineLive : copy.pipelineShadow}</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {liveEnabled ? copy.liveDescription : copy.shadowDescription}
          </p>
        </div>
        <AdminProductIntakeQueue
          locale={locale}
          initialRuns={runs}
          initialDetail={detail}
          initialPreviewUrl={preview ? `/store/preview/${preview.token}` : null}
        />
      </div>
    </AdminShell>
  );
}
