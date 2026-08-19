import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { verifyPreviewToken } from "@/lib/product-intake/preview-token";
import { createIntakeAssetToken } from "@/lib/product-intake/asset-token";
import { getProductIntakeRunDetail } from "@/lib/product-intake/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Produktvorschau | Apfel Park",
  robots: { index: false, follow: false, nocache: true },
};

const value = (entry: string | number | null | undefined) => entry ?? "—";

const loadPreview = async (token: string) => {
  const secret = process.env.PRODUCT_INTAKE_PREVIEW_SECRET?.trim() ?? "";
  try {
    const claims = verifyPreviewToken(token, secret);
    const detail = await getProductIntakeRunDetail(claims.runId);
    return detail.run.proposal && detail.run.proposalHash === claims.proposalHash ? detail : null;
  } catch {
    return null;
  }
};

export default async function ProductIntakePreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const detail = await loadPreview(token);
  const proposal = detail?.run.proposal;
  if (!detail || !proposal) notFound();
  const { run } = detail;
  const imageAsset = detail.assets.find((asset) =>
    asset.kind === "shop_photo" && asset.metadata.publishable === true && !asset.containsSensitiveIdentifiers,
  );
  const assetSecret = process.env.PRODUCT_INTAKE_ASSET_SECRET?.trim() ?? "";
  const imageToken = imageAsset && assetSecret.length >= 32
    ? createIntakeAssetToken({ assetKey: imageAsset.assetKey, sha256: imageAsset.sha256 }, assetSecret).token
    : null;

  return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-border/60 bg-surface/70 p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Nur Vorschau · Noindex</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">{proposal.product.title ?? "Produktvorschlag"}</h1>
                <p className="mt-2 text-sm text-muted">{run.intakeCode} · {proposal.operation === "create" ? "Neues Produkt" : "Produkt aktualisieren"}</p>
              </div>
              <span className="rounded-full border border-border/70 px-3 py-1.5 text-sm font-semibold text-muted">
                {run.status}
              </span>
            </div>

            {imageToken ? (
              <div className="mt-7 overflow-hidden rounded-2xl border border-border/60 bg-white">
                <Image src={`/api/integrations/product-intake/assets/${imageToken}`} alt={`${proposal.product.title ?? "Produkt"} Vorschau`} width={1500} height={1500} unoptimized className="mx-auto aspect-square w-full max-w-xl object-contain" />
              </div>
            ) : null}

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Zustand", proposal.condition],
                ["Marke", proposal.product.brand],
                ["Modell", proposal.product.model],
                ["Speicher", proposal.product.storage],
                ["Farbe", proposal.product.color],
                ["Kategorie", proposal.product.category],
                ["SKU", proposal.target.sku],
                ["GTIN", proposal.target.gtin],
                ["MPN", proposal.target.mpn],
                ["Hardwaremodell", proposal.target.hardwareModel],
                ["Batterie", proposal.product.batteryHealth == null ? null : `${proposal.product.batteryHealth}%`],
                ["Zubehör", (proposal.product.includedAccessories ?? []).join(", ")],
                ["Preis", proposal.changes.price == null ? null : `${proposal.changes.price.toFixed(2)} €`],
                ["Menge", proposal.changes.inventory ? `${proposal.changes.inventory.mode}: ${proposal.changes.inventory.quantity}` : null],
                ["Match", run.matchResult.state],
              ].map(([label, content]) => (
                <div key={String(label)} className="rounded-2xl border border-border/60 bg-background/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
                  <p className="mt-2 break-words text-sm font-semibold">{value(content)}</p>
                </div>
              ))}
            </div>

            {proposal.notes ? (
              <section className="mt-6 rounded-2xl border border-border/60 bg-background/45 p-5">
                <h2 className="font-semibold">Zustandshinweis</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{proposal.notes}</p>
              </section>
            ) : null}

            <section className="mt-6">
              <h2 className="text-lg font-semibold">DE / EN Listing-Vorschau</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(["de", "en"] as const).map((language) => {
                  const copy = proposal.listingPreview?.[language];
                  return (
                    <article key={language} className="rounded-2xl border border-border/60 bg-background/45 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{language}</p>
                      <h3 className="mt-2 font-semibold">{copy?.title ?? "—"}</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{copy?.description ?? "—"}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-lg font-semibold">Validierung</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm font-semibold">Blocker ({run.validation.blockers.length})</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {run.validation.blockers.length ? run.validation.blockers.map((item) => <li key={item.code}>• {item.message}</li>) : <li>Keine</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-semibold">Hinweise ({run.validation.warnings.length})</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {run.validation.warnings.length ? run.validation.warnings.map((item) => <li key={item.code}>• {item.message}</li>) : <li>Keine</li>}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-lg font-semibold">Offizielle Quellen</h2>
              <ul className="mt-3 space-y-2">
                {proposal.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gold underline underline-offset-4">
                      {source.title || source.kind} ↗
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="text-muted"><tr><th className="pb-2 pr-3">Feld</th><th className="pb-2 pr-3">Wert</th><th className="pb-2 pr-3">Quelle</th><th className="pb-2">Konfidenz</th></tr></thead>
                  <tbody className="divide-y divide-border/50">
                    {(proposal.facts ?? []).map((fact, index) => (
                      <tr key={`${fact.field}-${index}`}><td className="py-2 pr-3">{fact.field}</td><td className="py-2 pr-3 text-muted">{String(fact.value)}</td><td className="py-2 pr-3 text-gold">{fact.sourceType}</td><td className="py-2 text-muted">{Math.round(fact.confidence * 100)}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-lg font-semibold">Kanalbereitschaft</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(run.validation.readiness).map(([channel, result]) => (
                  <div key={channel} className="rounded-2xl border border-border/60 bg-background/45 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{channel}</p>
                    <p className={result.ready ? "mt-2 font-semibold text-emerald-400" : "mt-2 font-semibold text-amber-400"}>{result.ready ? "Ready" : "Blocked"}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
  );
}
