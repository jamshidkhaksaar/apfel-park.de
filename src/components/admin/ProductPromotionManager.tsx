"use client";
import { useState, useTransition } from 'react';
import type { AdminLocale } from '@/lib/admin-i18n';
import type { AdminProductRecord, PromoSettings } from '@/lib/admin-product-types';
export default function ProductPromotionManager({ locale, products, promo }: { locale: AdminLocale; products: AdminProductRecord[]; promo: PromoSettings }) {
  const [promoState, setPromoState] = useState(promo);
  const [promoMessage, setPromoMessage] = useState('');
  const [isSavingPromo, startSavingPromo] = useTransition();
  const savePromo = () => {
    startSavingPromo(async () => {
      setPromoMessage("");
      const response = await fetch("/api/admin/products/promo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promoState),
      });
      const payload = await response.json();
      if (!response.ok) {
        setPromoMessage(payload.error || (locale === "de" ? "Aktion konnte nicht gespeichert werden." : "Failed to save promotion."));
        return;
      }
      setPromoMessage(locale === "de" ? "Aktion gespeichert." : "Promotion saved.");
    });
  };

  return (
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {locale === "de" ? "Popup-Aktion" : "Promotion popup"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  {locale === "de" ? "Saisonale Rabatte sichtbar machen" : "Highlight seasonal discounts"}
                </h3>
              </div>
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={promoState.enabled}
                  onChange={(event) => setPromoState((prev) => ({ ...prev, enabled: event.target.checked }))}
                />
                {locale === "de" ? "Popup aktiv" : "Popup active"}
              </label>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">DE {locale === "de" ? "Titel" : "Title"}</span>
                <input value={promoState.title.de} onChange={(event) => setPromoState((prev) => ({ ...prev, title: { ...prev.title, de: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">EN {locale === "de" ? "Titel" : "Title"}</span>
                <input value={promoState.title.en} onChange={(event) => setPromoState((prev) => ({ ...prev, title: { ...prev.title, en: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">DE {locale === "de" ? "Beschreibung" : "Description"}</span>
                <textarea rows={3} value={promoState.description.de} onChange={(event) => setPromoState((prev) => ({ ...prev, description: { ...prev.description, de: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">EN {locale === "de" ? "Beschreibung" : "Description"}</span>
                <textarea rows={3} value={promoState.description.en} onChange={(event) => setPromoState((prev) => ({ ...prev, description: { ...prev.description, en: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">DE CTA</span>
                <input value={promoState.ctaLabel.de} onChange={(event) => setPromoState((prev) => ({ ...prev, ctaLabel: { ...prev.ctaLabel, de: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">EN CTA</span>
                <input value={promoState.ctaLabel.en} onChange={(event) => setPromoState((prev) => ({ ...prev, ctaLabel: { ...prev.ctaLabel, en: event.target.value } }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
              <label className="space-y-2 lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">CTA URL</span>
                <input value={promoState.ctaHref} onChange={(event) => setPromoState((prev) => ({ ...prev, ctaHref: event.target.value }))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground" />
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {locale === "de" ? "Produkte im Popup (max. 3)" : "Products in popup (max 3)"}
                </p>
                <span className="text-[11px] text-muted">
                  {(promoState.pinnedProductIds?.length ?? 0)} / 3 {locale === "de" ? "gewahlt" : "selected"}
                </span>
              </div>
              {(promoState.pinnedProductIds?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {promoState.pinnedProductIds?.map((id) => {
                    const p = products.find((item) => item.id === id);
                    if (!p) return null;
                    return (
                      <span key={id} className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-foreground">
                        {p.title}
                        <button
                          type="button"
                          onClick={() => setPromoState((prev) => ({ ...prev, pinnedProductIds: prev.pinnedProductIds?.filter((pid) => pid !== id) }))}
                          className="text-muted hover:text-red-300"
                          aria-label={locale === "de" ? "Entfernen" : "Remove"}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="rounded-2xl border border-border/60 bg-background/40 p-1">
                <input
                  type="text"
                  placeholder={locale === "de" ? "Produkt suchen..." : "Search product..."}
                  className="w-full rounded-xl bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
                  onChange={(event) => {
                    const q = event.target.value.toLowerCase().trim();
                    const el = event.target.closest(".promo-product-list") as HTMLElement | null ?? event.target.parentElement?.nextElementSibling as HTMLElement | null;
                    if (!el) return;
                    el.querySelectorAll<HTMLElement>("[data-title]").forEach((row) => {
                      row.style.display = !q || row.dataset.title?.toLowerCase().includes(q) ? "" : "none";
                    });
                  }}
                />
              </div>
              <div className="promo-product-list max-h-48 overflow-y-auto rounded-2xl border border-border/60 bg-background/40 divide-y divide-border/40">
                {products.map((p) => {
                  const isPinned = promoState.pinnedProductIds?.includes(p.id) ?? false;
                  const atLimit = (promoState.pinnedProductIds?.length ?? 0) >= 3;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-title={p.title}
                      disabled={!isPinned && atLimit}
                      onClick={() =>
                        setPromoState((prev) => ({
                          ...prev,
                          pinnedProductIds: isPinned
                            ? prev.pinnedProductIds?.filter((id) => id !== p.id)
                            : [...(prev.pinnedProductIds ?? []), p.id],
                        }))
                      }
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${isPinned ? "bg-gold/10 text-foreground" : atLimit ? "opacity-40 cursor-not-allowed text-muted" : "text-muted hover:bg-surface/60 hover:text-foreground"}`}
                    >
                      <span className="truncate font-medium">{p.title}</span>
                      <span className={`ml-3 shrink-0 text-[10px] font-bold uppercase tracking-wider ${isPinned ? "text-gold" : "text-muted"}`}>
                        {isPinned ? (locale === "de" ? "Gewahlt" : "Selected") : (locale === "de" ? "Wahlen" : "Select")}
                      </span>
                    </button>
                  );
                })}
              </div>
              {(promoState.pinnedProductIds?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setPromoState((prev) => ({ ...prev, pinnedProductIds: [] }))}
                  className="text-xs font-semibold uppercase tracking-[0.15em] text-red-300 hover:text-red-200"
                >
                  {locale === "de" ? "Alle entfernen (Rabattprodukte automatisch)" : "Clear all (auto discount products)"}
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={savePromo}
                disabled={isSavingPromo}
                className="rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-gold-deep disabled:opacity-70"
              >
                {isSavingPromo ? (locale === "de" ? "Speichern ..." : "Saving ...") : (locale === "de" ? "Aktion speichern" : "Save promotion")}
              </button>
              {promoMessage ? <p className="text-sm text-muted">{promoMessage}</p> : null}
            </div>
          </section>
  );
}
