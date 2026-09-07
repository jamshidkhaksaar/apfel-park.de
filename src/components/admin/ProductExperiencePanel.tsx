"use client";

import type { Dispatch, SetStateAction } from 'react';
import type { AdminLocale } from '@/lib/admin-i18n';
import type { ExperienceCandidate, ExperienceFamilyState } from '@/lib/admin-product-types';
import { PRODUCT_EXPERIENCE_SECTIONS, type ProductExperienceProfile } from '@/lib/product-experience';
import { EXPERIENCE_PRESETS } from './product-experience-presets';

type ExperienceTab = 'features' | 'family' | 'contents' | 'condition' | 'trust' | 'compare' | 'campaign';
type Setter<T> = Dispatch<SetStateAction<T>>;
type Props = {
  locale: AdminLocale;
  experienceProfile: ProductExperienceProfile;
  setExperienceProfile: Setter<ProductExperienceProfile>;
  experienceTab: ExperienceTab;
  setExperienceTab: Setter<ExperienceTab>;
  experienceRawMode: Record<string, boolean>;
  setExperienceRawMode: Setter<Record<string, boolean>>;
  experienceContentsText: string;
  setExperienceContentsText: Setter<string>;
  experienceConditionText: string;
  experienceLines: (rows: string[][]) => string;
  syncContentsFromRaw: (text: string) => void;
  syncConditionFromRaw: (text: string) => void;
  familyQuery: string;
  setFamilyQuery: Setter<string>;
  candidateProducts: ExperienceCandidate[];
  familyState: ExperienceFamilyState;
  setFamilyState: Setter<ExperienceFamilyState>;
};

// State stays with the editor so switching wizard steps retains unsaved changes.
export default function ProductExperiencePanel({
  locale,
  experienceProfile,
  setExperienceProfile,
  experienceTab,
  setExperienceTab,
  experienceRawMode,
  setExperienceRawMode,
  experienceContentsText,
  setExperienceContentsText,
  experienceConditionText,
  experienceLines,
  syncContentsFromRaw,
  syncConditionFromRaw,
  familyQuery,
  setFamilyQuery,
  candidateProducts,
  familyState,
  setFamilyState,
}: Props) {
  return (
    <div id="experience" className="rounded-2xl border border-border/80 bg-surface/70 p-5 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h4 className="text-base font-bold text-heading flex items-center gap-2">
            <span>✨</span> {locale === "de" ? "8. Professionelles Produkt-Erlebnis (reBuy-Tools)" : "8. Professional Product Experience (reBuy-Tools)"}
          </h4>
          <p className="text-xs text-muted mt-0.5">
            {locale === "de"
              ? "Lieferumfang, Aufbereitung, 2D-Größenvergleich, Varianten-Konfigurator & Kampagnen"
              : "Package contents, refurbishment, 2D size comparison, family configurator & campaigns"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-gold shadow-sm">
          ✨ {Object.values(experienceProfile.enabledSections).filter(Boolean).length} / 10 {locale === "de" ? "Bereiche aktiv" : "sections active"}
        </span>
      </div>

      {/* SUB-TABS */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {[
          { id: "features", labelDe: "Freigaben", labelEn: "Features", icon: "⚙️" },
          { id: "contents", labelDe: "Lieferumfang", labelEn: "Package contents", icon: "📦", ai: true },
          { id: "condition", labelDe: "Zustand & Fotos", labelEn: "Condition & photos", icon: "🔍" },
          { id: "trust", labelDe: "Aufbereitung & Vertrauen", labelEn: "Refurbishment & trust", icon: "🛠️", ai: true },
          { id: "compare", labelDe: "Vergleich & Maße", labelEn: "Comparison & dimensions", icon: "📏", ai: true },
          { id: "family", labelDe: "Produktfamilie", labelEn: "Product family", icon: "👨‍👩‍👧" },
          { id: "campaign", labelDe: "Kampagne", labelEn: "Campaign", icon: "🏷️", ai: true },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={experienceTab === t.id}
            onClick={() => setExperienceTab(t.id as typeof experienceTab)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              experienceTab === t.id
                ? "border-gold/60 bg-gold/15 text-gold shadow-sm"
                : "border-border/60 bg-surface/50 text-muted hover:border-gold/30 hover:text-foreground"
            }`}
          >
            <span>{t.icon}</span>
            <span>{locale === "de" ? t.labelDe : t.labelEn}</span>
            {t.ai && <span className="text-[10px] text-gold font-bold">✨</span>}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: FEATURES / TOGGLES */}
      {experienceTab === "features" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
            <p className="text-xs text-muted">
              {locale === "de"
                ? "Aktivieren Sie gezielt die Module für dieses Produkt:"
                : "Enable specific experience modules for this product:"}
            </p>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    enabledSections: Object.keys(prev.enabledSections).reduce(
                      (acc, k) => ({ ...acc, [k]: true }),
                      {} as ProductExperienceProfile["enabledSections"],
                    ),
                  }))
                }
                className="rounded-md border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold hover:bg-gold/20"
              >
                ⚡ {locale === "de" ? "Alle aktivieren" : "Enable all"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    enabledSections: {
                      familyConfigurator: true,
                      packageContents: true,
                      conditionGuide: true,
                      refurbishment: true,
                      sizeComparison: true,
                      modelComparison: false,
                      bundles: true,
                      campaign: false,
                      tradeIn: true,
                      wishlist: true,
                    },
                  }))
                }
                className="rounded-md border border-border/80 bg-surface-strong px-2 py-0.5 text-[11px] font-semibold text-foreground hover:bg-surface"
              >
                ⚡ {locale === "de" ? "Standard aktivieren" : "Enable standard"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    enabledSections: Object.keys(prev.enabledSections).reduce(
                      (acc, k) => ({ ...acc, [k]: false }),
                      {} as ProductExperienceProfile["enabledSections"],
                    ),
                  }))
                }
                className="rounded-md border border-border/80 bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-foreground"
              >
                ✕ {locale === "de" ? "Alle aus" : "Disable all"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_EXPERIENCE_SECTIONS.map((sec) => {
              const active = experienceProfile.enabledSections[sec];
              const labelsMap: Record<string, { de: string; en: string; descDe: string; descEn: string; icon: string }> = {
                familyConfigurator: { icon: "👨‍👩‍👧", de: "Varianten-Konfigurator", en: "Variant configurator", descDe: "Verbindet Speichervarianten zu einer Produktfamilie", descEn: "Links sibling storage listings into a unified family" },
                packageContents: { icon: "📦", de: "Lieferumfang (Was ist enthalten?)", en: "Package contents", descDe: "Zeigt Checkliste von Kabel, OVP, Netzteil", descEn: "Shows checklist of cable, packaging, adapter" },
                conditionGuide: { icon: "🔍", de: "Zustandsvergleich & Fotos", en: "Condition guide", descDe: "Visuelle Erklärung von Neu, Open-Box, Gebraucht", descEn: "Visual guide explaining New, Open Box, Used" },
                refurbishment: { icon: "🛠️", de: "Aufbereitung & Prüfung", en: "Refurbishment & testing", descDe: "50+ Prüfpunkte & Qualitätsversprechen", descEn: "50+ inspection checkpoints & store guarantee" },
                sizeComparison: { icon: "📏", de: "Größenvergleich (2D-Silhouetten)", en: "Size comparison (2D)", descDe: "Maßstabsgetreuer 2D-Gerätevergleich", descEn: "Scaled 2D device silhouette comparison" },
                modelComparison: { icon: "⚖️", de: "Modellvergleich-Tabelle", en: "Model comparison table", descDe: "Vergleichstabelle mit ausgewählten Produkten", descEn: "Spec comparison table with selected products" },
                bundles: { icon: "🛒", de: "Kompatible Bundles & Zubehör", en: "Compatible bundles", descDe: "1-Klick-Zubehörbundles (Hüllen, Netzteile)", descEn: "1-click accessory bundles (cases, adapters)" },
                campaign: { icon: "🏷️", de: "Produktkampagne (Gold-Banner)", en: "Product campaign banner", descDe: "Prominentes Promo-Banner über dem Preis", descEn: "Prominent promotional banner above price" },
                tradeIn: { icon: "🔄", de: "Trade-in Ankauf-Box", en: "Trade-in request box", descDe: "Ankauf-Banner mit Link zu /trade-in", descEn: "Sell old device banner linking to /trade-in" },
                wishlist: { icon: "❤️", de: "Wunschliste (Herz-Button)", en: "Wishlist heart button", descDe: "Herz-Button speichert Gerät in Kunden-Session", descEn: "Heart button saving product to customer session" },
              };
              const info = labelsMap[sec] ?? { icon: "⚙️", de: sec, en: sec, descDe: "", descEn: "" };
              return (
                <label
                  key={sec}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                    active
                      ? "border-gold/60 bg-gold/10 shadow-sm"
                      : "border-border/60 bg-surface/40 hover:border-gold/30 hover:bg-surface/70"
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{info.icon}</span>
                      <span>{locale === "de" ? info.de : info.en}</span>
                    </p>
                    <p className="text-[11px] text-muted leading-tight">{locale === "de" ? info.descDe : info.descEn}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) =>
                      setExperienceProfile((prev) => ({
                        ...prev,
                        enabledSections: { ...prev.enabledSections, [sec]: e.target.checked },
                      }))
                    }
                    className="h-5 w-5 rounded border-border text-gold focus:ring-gold accent-gold shrink-0 mt-0.5"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PACKAGE CONTENTS */}
      {experienceTab === "contents" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                <span>📦</span> {locale === "de" ? "Lieferumfang (Was ist im Karton?)" : "Package Contents (In the Box)"}
              </span>
              <p className="text-[11px] text-muted mt-0.5">
                {locale === "de" ? "Definieren Sie, welche Zubehörteile beiliegen oder separat erworben werden müssen." : "Define items included in the box or required separately."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExperienceRawMode((prev) => ({ ...prev, contents: !prev.contents }))}
                className="rounded-md border border-border/80 bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-foreground"
              >
                {experienceRawMode.contents ? "🎨 " + (locale === "de" ? "Visueller Editor" : "Visual builder") : "📝 " + (locale === "de" ? "Text-Import" : "Raw text")}
              </button>
              <button
                type="button"
                onClick={() =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    packageContents: [...prev.packageContents, { label: { de: "", en: "" }, included: true }],
                  }))
                }
                className="rounded-lg border border-gold bg-gold/15 px-3 py-1 text-xs font-bold text-gold hover:bg-gold/25 transition"
              >
                + {locale === "de" ? "Gegenstand hinzufügen" : "Add item"}
              </button>
            </div>
          </div>

          {/* PRESETS BAR */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-muted">⚡ Presets:</span>
            {(["iphone", "samsung", "macbook", "ipad", "watch"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const preset = EXPERIENCE_PRESETS.packageContents[key];
                  setExperienceProfile((prev) => ({ ...prev, packageContents: preset }));
                  setExperienceContentsText(experienceLines(preset.map((i) => [i.label.de, i.label.en, i.included ? "yes" : "no"])));
                }}
                className="rounded-md border border-border/80 bg-surface-strong px-2 py-0.5 text-[11px] font-semibold text-foreground hover:border-gold/40 hover:bg-gold/10 hover:text-gold transition"
              >
                {key === "iphone" ? "iPhone" : key === "samsung" ? "Samsung" : key === "macbook" ? "MacBook" : key === "ipad" ? "iPad" : "Apple Watch"}
              </button>
            ))}
          </div>

          {experienceRawMode.contents ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">Format: Deutsch | Englisch | yes/no</p>
              <textarea
                rows={8}
                value={experienceContentsText}
                onChange={(e) => syncContentsFromRaw(e.target.value)}
                placeholder="USB-C Ladekabel | USB-C charge cable | yes&#10;Dokumentation | Documentation | yes&#10;Netzteil | Power adapter | no"
                className="w-full font-mono text-xs rounded-xl border border-border/80 bg-surface px-4 py-3 text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors"
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {experienceProfile.packageContents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-surface/40 p-6 text-center text-xs text-muted">
                  {locale === "de" ? "Keine Lieferumfang-Einträge. Nutzen Sie die Presets oben oder '+ Gegenstand hinzufügen'." : "No box contents. Use presets above or click '+ Add item'."}
                </div>
              ) : (
                experienceProfile.packageContents.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border/70 bg-surface-strong/70 p-3 shadow-sm">
                    {/* Included Toggle Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setExperienceProfile((prev) => ({
                          ...prev,
                          packageContents: prev.packageContents.map((it, i) => (i === idx ? { ...it, included: !it.included } : it)),
                        }))
                      }
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                        item.included
                          ? "border border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                          : "border border-border/80 bg-surface text-muted line-through"
                      }`}
                    >
                      <span>{item.included ? "✓" : "✗"}</span>
                      <span>{item.included ? (locale === "de" ? "Im Karton" : "In box") : (locale === "de" ? "Separat" : "Separate")}</span>
                    </button>

                    {/* Title DE */}
                    <input
                      value={item.label.de}
                      onChange={(e) =>
                        setExperienceProfile((prev) => ({
                          ...prev,
                          packageContents: prev.packageContents.map((it, i) => (i === idx ? { ...it, label: { ...it.label, de: e.target.value } } : it)),
                        }))
                      }
                      placeholder="Bezeichnung DE (z. B. USB-C Ladekabel)"
                      className="flex-1 min-w-[160px] rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                    />

                    {/* Title EN */}
                    <input
                      value={item.label.en}
                      onChange={(e) =>
                        setExperienceProfile((prev) => ({
                          ...prev,
                          packageContents: prev.packageContents.map((it, i) => (i === idx ? { ...it, label: { ...it.label, en: e.target.value } } : it)),
                        }))
                      }
                      placeholder="Label EN (e.g. USB-C charge cable)"
                      className="flex-1 min-w-[160px] rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                    />

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() =>
                        setExperienceProfile((prev) => ({
                          ...prev,
                          packageContents: prev.packageContents.filter((_, i) => i !== idx),
                        }))
                      }
                      className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400 transition"
                      title="Eintrag löschen"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CONDITION GUIDE */}
      {experienceTab === "condition" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                <span>🔍</span> {locale === "de" ? "Zustandsvergleich & Beispielfotos" : "Condition Guide & Sample Photos"}
              </span>
              <p className="text-[11px] text-muted mt-0.5">
                {locale === "de" ? "Erläuterung der 3 Gerätezustände für Kunden im Shop." : "Visual guide for customer transparency across 3 condition grades."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setExperienceProfile((prev) => ({ ...prev, conditionGuide: EXPERIENCE_PRESETS.conditionGuide }));
                }}
                className="rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold hover:bg-gold/20"
              >
                ⚡ {locale === "de" ? "Standard-Texte laden" : "Load defaults"}
              </button>
              <button
                type="button"
                onClick={() => setExperienceRawMode((prev) => ({ ...prev, condition: !prev.condition }))}
                className="rounded-md border border-border/80 bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-foreground"
              >
                {experienceRawMode.condition ? "🎨 " + (locale === "de" ? "Visueller Editor" : "Visual builder") : "📝 " + (locale === "de" ? "Text-Import" : "Raw text")}
              </button>
            </div>
          </div>

          {experienceRawMode.condition ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">Format: Zustand | Titel DE | Titel EN | Beschreibung DE | Beschreibung EN | Bild-URLs</p>
              <textarea
                rows={8}
                value={experienceConditionText}
                onChange={(e) => syncConditionFromRaw(e.target.value)}
                placeholder="new | Neu & OVP | New & Sealed | Originalverpackt und versiegelt | Factory sealed | /uploads/products/example.webp"
                className="w-full font-mono text-xs rounded-xl border border-border/80 bg-surface px-4 py-3 text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none transition-colors"
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { key: "new", badge: "✨ Neu & OVP", descFallbackDe: "Originalverpackt und ungeöffnet mit voller Garantie.", descFallbackEn: "Brand new factory sealed in box." },
                { key: "open_box", badge: "📦 Open-Box", descFallbackDe: "Neuwertig, nur zur Prüfung geöffnet. Keine Gebrauchsspuren.", descFallbackEn: "Like new, unsealed box. Zero wear." },
                { key: "used", badge: "🔄 Gebraucht A+", descFallbackDe: "Technisch einwandfrei, 50+ Punkte geprüft. Minimale Mikrokratzer.", descFallbackEn: "Technically flawless, 50+ points certified." },
              ].map((cond) => {
                const item = experienceProfile.conditionGuide.find((g) => g.condition === cond.key) ?? {
                  condition: cond.key as "new" | "open_box" | "used",
                  label: { de: cond.badge, en: cond.key === "new" ? "Brand New" : cond.key === "open_box" ? "Open Box" : "Refurbished A+" },
                  description: { de: cond.descFallbackDe, en: cond.descFallbackEn },
                  imageUrls: [],
                };

                const updateItem = (patch: Partial<typeof item>) => {
                  setExperienceProfile((prev) => {
                    const exists = prev.conditionGuide.some((g) => g.condition === cond.key);
                    const updatedGuide = exists
                      ? prev.conditionGuide.map((g) => (g.condition === cond.key ? { ...g, ...patch } : g))
                      : [...prev.conditionGuide, { ...item, ...patch }];
                    return { ...prev, conditionGuide: updatedGuide };
                  });
                };

                return (
                  <div key={cond.key} className="rounded-2xl border border-border/80 bg-surface-strong/70 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-xs font-bold text-gold">{cond.badge}</span>
                      <span className="text-[10px] font-mono text-muted uppercase">{cond.key}</span>
                    </div>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-muted">Titel DE</span>
                      <input
                        value={item.label.de}
                        onChange={(e) => updateItem({ label: { ...item.label, de: e.target.value } })}
                        className="w-full rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-muted">Title EN</span>
                      <input
                        value={item.label.en}
                        onChange={(e) => updateItem({ label: { ...item.label, en: e.target.value } })}
                        className="w-full rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-muted">Beschreibung DE</span>
                      <textarea
                        rows={2}
                        value={item.description.de}
                        onChange={(e) => updateItem({ description: { ...item.description, de: e.target.value } })}
                        className="w-full rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[11px] font-semibold text-muted">Description EN</span>
                      <textarea
                        rows={2}
                        value={item.description.en}
                        onChange={(e) => updateItem({ description: { ...item.description, en: e.target.value } })}
                        className="w-full rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: REFURBISHMENT & TRUST */}
      {experienceTab === "trust" && (
        <div className="space-y-6">
          {/* Section 1: Refurbishment Steps */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                  <span>🛠️</span> {locale === "de" ? "Aufbereitungsschritte (Prüfprozess 01, 02...)" : "Refurbishment Steps (01, 02...)"}
                </span>
                <p className="text-[11px] text-muted mt-0.5">
                  {locale === "de" ? "Schritte unseres Qualitäts- und Aufbereitungsverfahrens." : "Steps of our certified refurbishment and testing process."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExperienceProfile((prev) => ({ ...prev, refurbishmentSteps: EXPERIENCE_PRESETS.refurbishmentSteps }));
                  }}
                  className="rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold hover:bg-gold/20"
                >
                  ⚡ {locale === "de" ? "4-Stufen Prozess laden" : "Load 4-step process"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExperienceProfile((prev) => ({
                      ...prev,
                      refurbishmentSteps: [...prev.refurbishmentSteps, { title: { de: "", en: "" }, description: { de: "", en: "" } }],
                    }))
                  }
                  className="rounded-lg border border-gold bg-gold/15 px-3 py-1 text-xs font-bold text-gold hover:bg-gold/25 transition"
                >
                  + {locale === "de" ? "Schritt hinzufügen" : "Add step"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {experienceProfile.refurbishmentSteps.length === 0 ? (
                <div className="col-span-2 rounded-xl border border-dashed border-border/80 bg-surface/40 p-4 text-center text-xs text-muted">
                  {locale === "de" ? "Keine Schritte angelegt. Klicken Sie auf '4-Stufen Prozess laden' oder '+ Schritt hinzufügen'." : "No steps configured."}
                </div>
              ) : (
                experienceProfile.refurbishmentSteps.map((step, idx) => (
                  <div key={idx} className="rounded-xl border border-border/80 bg-surface-strong/70 p-3.5 space-y-2 relative shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                      <span className="text-xs font-bold text-gold">Schritt 0{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExperienceProfile((prev) => ({
                            ...prev,
                            refurbishmentSteps: prev.refurbishmentSteps.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-muted hover:text-red-400 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={step.title.de}
                        onChange={(e) =>
                          setExperienceProfile((prev) => ({
                            ...prev,
                            refurbishmentSteps: prev.refurbishmentSteps.map((s, i) => (i === idx ? { ...s, title: { ...s.title, de: e.target.value } } : s)),
                          }))
                        }
                        placeholder="Titel DE (z. B. 50+ Prüfpunkte)"
                        className="rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                      <input
                        value={step.title.en}
                        onChange={(e) =>
                          setExperienceProfile((prev) => ({
                            ...prev,
                            refurbishmentSteps: prev.refurbishmentSteps.map((s, i) => (i === idx ? { ...s, title: { ...s.title, en: e.target.value } } : s)),
                          }))
                        }
                        placeholder="Title EN (e.g. 50+ Point Check)"
                        className="rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <textarea
                        rows={2}
                        value={step.description.de}
                        onChange={(e) =>
                          setExperienceProfile((prev) => ({
                            ...prev,
                            refurbishmentSteps: prev.refurbishmentSteps.map((s, i) => (i === idx ? { ...s, description: { ...s.description, de: e.target.value } } : s)),
                          }))
                        }
                        placeholder="Beschreibung DE..."
                        className="rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        value={step.description.en}
                        onChange={(e) =>
                          setExperienceProfile((prev) => ({
                            ...prev,
                            refurbishmentSteps: prev.refurbishmentSteps.map((s, i) => (i === idx ? { ...s, description: { ...s.description, en: e.target.value } } : s)),
                          }))
                        }
                        placeholder="Description EN..."
                        className="rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Trust Points */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                  <span>✓</span> {locale === "de" ? "Vertrauenspunkte (Garantie & Store-Vorteile)" : "Trust Points & Store Guarantees"}
                </span>
                <p className="text-[11px] text-muted mt-0.5">
                  {locale === "de" ? "Garantieversprechen, Vor-Ort-Service in Hamburg und Rückgaberecht." : "Store warranty, local pickup service and buyer protection."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExperienceProfile((prev) => ({ ...prev, trustPoints: EXPERIENCE_PRESETS.trustPoints }));
                  }}
                  className="rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold hover:bg-gold/20"
                >
                  ⚡ {locale === "de" ? "3-Punkte Paket laden" : "Load 3-point bundle"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExperienceProfile((prev) => ({
                      ...prev,
                      trustPoints: [...prev.trustPoints, { title: { de: "", en: "" }, description: { de: "", en: "" } }],
                    }))
                  }
                  className="rounded-lg border border-gold bg-gold/15 px-3 py-1 text-xs font-bold text-gold hover:bg-gold/25 transition"
                >
                  + {locale === "de" ? "Vertrauenspunkt hinzufügen" : "Add trust point"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {experienceProfile.trustPoints.length === 0 ? (
                <div className="col-span-3 rounded-xl border border-dashed border-border/80 bg-surface/40 p-4 text-center text-xs text-muted">
                  {locale === "de" ? "Keine Vertrauenspunkte angelegt." : "No trust points configured."}
                </div>
              ) : (
                experienceProfile.trustPoints.map((tp, idx) => (
                  <div key={idx} className="rounded-xl border border-border/80 bg-surface-strong/70 p-3.5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                      <span className="text-xs font-bold text-gold">🛡️ Vorteil 0{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExperienceProfile((prev) => ({
                            ...prev,
                            trustPoints: prev.trustPoints.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-muted hover:text-red-400 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                    <input
                      value={tp.title.de}
                      onChange={(e) =>
                        setExperienceProfile((prev) => ({
                          ...prev,
                          trustPoints: prev.trustPoints.map((t, i) => (i === idx ? { ...t, title: { ...t.title, de: e.target.value } } : t)),
                        }))
                      }
                      placeholder="Titel DE (z. B. Klare Zustandsangaben)"
                      className="w-full rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                    />
                    <input
                      value={tp.title.en}
                      onChange={(e) =>
                        setExperienceProfile((prev) => ({
                          ...prev,
                          trustPoints: prev.trustPoints.map((t, i) => (i === idx ? { ...t, title: { ...t.title, en: e.target.value } } : t)),
                        }))
                      }
                      placeholder="Title EN (e.g. 12 Months Warranty)"
                      className="w-full rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={tp.description.de}
                      onChange={(e) =>
                        setExperienceProfile((prev) => ({
                          ...prev,
                          trustPoints: prev.trustPoints.map((t, i) => (i === idx ? { ...t, description: { ...t.description, de: e.target.value } } : t)),
                        }))
                      }
                      placeholder="Beschreibung DE..."
                      className="w-full rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: COMPARISON & DIMENSIONS */}
      {experienceTab === "compare" && (
        <div className="space-y-5">
          {/* 2D Dimensions with Live Silhouette & Model Presets */}
          <div className="rounded-2xl border border-border/80 bg-surface-strong/70 p-4 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                  <span>📏</span> {locale === "de" ? "Geräte-Abmessungen & 2D-Silhouette" : "Device Dimensions & 2D Silhouette"}
                </span>
                <p className="text-[11px] text-muted mt-0.5">
                  {locale === "de" ? "Ermöglicht den maßstabsgetreuen Größenvergleich auf der Produktseite." : "Powers the scaled 2D silhouette comparison tool on the storefront."}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-gold">✨ KI-ausfüllbar</span>
            </div>

            {/* Quick Model Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-muted">⚡ Presets:</span>
              {Object.entries(EXPERIENCE_PRESETS.dimensions).map(([modelName, dims]) => (
                <button
                  key={modelName}
                  type="button"
                  onClick={() =>
                    setExperienceProfile((prev) => ({
                      ...prev,
                      dimensions: { ...prev.dimensions, ...dims },
                    }))
                  }
                  className="rounded-md border border-border/80 bg-surface px-2 py-0.5 text-[11px] font-semibold text-foreground hover:border-gold/40 hover:bg-gold/10 hover:text-gold transition"
                >
                  {modelName}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Inputs Column */}
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "heightMm", label: "Höhe (mm)", placeholder: "146.6", icon: "📐" },
                  { key: "widthMm", label: "Breite (mm)", placeholder: "70.6", icon: "↔️" },
                  { key: "depthMm", label: "Tiefe (mm)", placeholder: "8.25", icon: "↕️" },
                  { key: "weightG", label: "Gewicht (g)", placeholder: "187", icon: "⚖️" },
                  { key: "screenInches", label: "Display (Zoll)", placeholder: "6.1", icon: "📱" },
                ].map((dim) => (
                  <label key={dim.key} className="space-y-1 block rounded-xl border border-border/70 bg-surface p-3">
                    <span className="text-xs font-semibold text-muted flex items-center gap-1">
                      <span>{dim.icon}</span>
                      <span>{dim.label}</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={experienceProfile.dimensions[dim.key as keyof ProductExperienceProfile["dimensions"]] ?? ""}
                      onChange={(e) =>
                        setExperienceProfile((prev) => ({
                          ...prev,
                          dimensions: {
                            ...prev.dimensions,
                            [dim.key]: e.target.value ? Number(e.target.value) : undefined,
                          },
                        }))
                      }
                      placeholder={dim.placeholder}
                      className="w-full rounded-lg border border-border/80 bg-surface-strong px-2.5 py-1.5 text-sm font-semibold text-foreground focus:border-gold focus:outline-none"
                    />
                  </label>
                ))}
              </div>

              {/* Live 2D Silhouette Preview */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-gold/30 bg-gold/5 p-4 text-center space-y-2">
                <span className="text-[11px] font-bold text-gold uppercase tracking-wider">📐 2D Live-Silhouette</span>
                <div
                  className="border-2 border-gold/70 bg-neutral-900 rounded-[14px] flex flex-col items-center justify-center text-[10px] text-gold font-mono shadow-md transition-all"
                  style={{
                    width: `${Math.max(45, Math.min(100, (experienceProfile.dimensions.widthMm ?? 70) * 0.9))}px`,
                    height: `${Math.max(80, Math.min(150, (experienceProfile.dimensions.heightMm ?? 146) * 0.9))}px`,
                  }}
                >
                  <span className="font-bold">{experienceProfile.dimensions.screenInches ? `${experienceProfile.dimensions.screenInches}"` : "–"}</span>
                </div>
                <p className="text-[10px] text-muted">
                  {experienceProfile.dimensions.heightMm || "–"} × {experienceProfile.dimensions.widthMm || "–"} × {experienceProfile.dimensions.depthMm || "–"} mm
                  {experienceProfile.dimensions.weightG ? ` · ${experienceProfile.dimensions.weightG}g` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Products & Bundles selection */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-surface-strong/70 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                  <span>⚖️</span> {locale === "de" ? "Vergleichsprodukte (Nebeneinander)" : "Comparison Products"}
                </span>
                <span className="text-[11px] text-gold font-semibold">{experienceProfile.comparisonProductIds.length} gewählt</span>
              </div>
              <input
                value={familyQuery}
                onChange={(e) => setFamilyQuery(e.target.value)}
                placeholder={locale === "de" ? "Produkte filtern..." : "Filter products..."}
                className="w-full rounded-xl border border-border/80 bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted"
              />
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {candidateProducts
                  .filter((p) => !familyQuery || p.title.toLowerCase().includes(familyQuery.toLowerCase()))
                  .slice(0, 30)
                  .map((cand) => {
                    const selected = experienceProfile.comparisonProductIds.includes(cand.id);
                    return (
                      <label
                        key={cand.id}
                        className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs cursor-pointer transition ${
                          selected ? "border-gold/60 bg-gold/15 text-foreground" : "border-border/40 bg-surface text-muted hover:border-gold/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setExperienceProfile((prev) => ({
                              ...prev,
                              comparisonProductIds: selected
                                ? prev.comparisonProductIds.filter((id) => id !== cand.id)
                                : [...prev.comparisonProductIds, cand.id],
                            }))
                          }
                          className="h-4 w-4 rounded border-border text-gold focus:ring-gold accent-gold"
                        />
                        <span className="truncate flex-1 font-medium">{cand.title}</span>
                        <span className="text-[10px] text-gold font-bold">{Number(cand.price).toFixed(2)} €</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface-strong/70 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                  <span>🛒</span> {locale === "de" ? "Kompatible Bundles & Zubehör" : "Compatible Bundles"}
                </span>
                <span className="text-[11px] text-gold font-semibold">{experienceProfile.bundleProductIds.length} gewählt</span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {candidateProducts
                  .filter((p) => !familyQuery || p.title.toLowerCase().includes(familyQuery.toLowerCase()))
                  .slice(0, 30)
                  .map((cand) => {
                    const selected = experienceProfile.bundleProductIds.includes(cand.id);
                    return (
                      <label
                        key={cand.id}
                        className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs cursor-pointer transition ${
                          selected ? "border-gold/60 bg-gold/15 text-foreground" : "border-border/40 bg-surface text-muted hover:border-gold/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setExperienceProfile((prev) => ({
                              ...prev,
                              bundleProductIds: selected
                                ? prev.bundleProductIds.filter((id) => id !== cand.id)
                                : [...prev.bundleProductIds, cand.id],
                            }))
                          }
                          className="h-4 w-4 rounded border-border text-gold focus:ring-gold accent-gold"
                        />
                        <span className="truncate flex-1 font-medium">{cand.title}</span>
                        <span className="text-[10px] text-gold font-bold">{Number(cand.price).toFixed(2)} €</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: PRODUCT FAMILY */}
      {experienceTab === "family" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-muted">{locale === "de" ? "Familienname" : "Family Name"}</span>
              <input
                value={familyState.name}
                onChange={(e) => setFamilyState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="z. B. iPhone 15 Pro Familie"
                className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-muted">Slug</span>
              <input
                value={familyState.slug}
                onChange={(e) => setFamilyState((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="z. B. iphone-15-pro-family"
                className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-muted">{locale === "de" ? "Optionen / Achsen (kommagetrennt)" : "Option Axes (comma separated)"}</span>
            <input
              value={familyState.optionAxes.join(", ")}
              onChange={(e) =>
                setFamilyState((prev) => ({
                  ...prev,
                  optionAxes: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
                }))
              }
              placeholder="Speicher, Farbe, Zustand"
              className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-heading cursor-pointer">
            <input
              type="checkbox"
              checked={familyState.isActive}
              onChange={(e) => setFamilyState((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-gold focus:ring-gold accent-gold"
            />
            <span>{locale === "de" ? "Produktfamilie im Shop aktivieren" : "Activate product family in store"}</span>
          </label>
          <div className="rounded-xl border border-border/80 bg-surface-strong/60 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-heading">
              👨‍👩‍👧 {locale === "de" ? "Mitglieder-Produkte zuweisen" : "Assign Member Products"}
            </span>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {candidateProducts
                .filter((p) => !familyQuery || p.title.toLowerCase().includes(familyQuery.toLowerCase()))
                .slice(0, 30)
                .map((cand) => {
                  const member = familyState.members.find((m) => m.productId === cand.id);
                  return (
                    <div key={cand.id} className="rounded-lg border border-border/40 bg-surface p-2.5 space-y-2">
                      <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(member)}
                          onChange={() =>
                            setFamilyState((prev) => {
                              const exists = prev.members.some((m) => m.productId === cand.id);
                              return {
                                ...prev,
                                members: exists
                                  ? prev.members.filter((m) => m.productId !== cand.id)
                                  : [...prev.members, { productId: cand.id, optionValues: {}, position: prev.members.length, isActive: true }],
                              };
                            })
                          }
                          className="h-4 w-4 rounded border-border text-gold focus:ring-gold accent-gold"
                        />
                        <span className="truncate flex-1 text-foreground">{cand.title}</span>
                        <span className="text-[10px] text-muted">{cand.price} €</span>
                      </label>
                      {member && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/30">
                          {familyState.optionAxes.map((axis) => (
                            <label key={axis} className="space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted">{axis}</span>
                              <input
                                value={member.optionValues[axis] ?? ""}
                                onChange={(e) =>
                                  setFamilyState((prev) => ({
                                    ...prev,
                                    members: prev.members.map((m) =>
                                      m.productId === cand.id
                                        ? { ...m, optionValues: { ...m.optionValues, [axis]: e.target.value } }
                                        : m
                                    ),
                                  }))
                                }
                                placeholder={axis}
                                className="w-full rounded-lg border border-border/80 bg-surface-strong px-2 py-1 text-xs text-foreground focus:border-gold focus:outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: CAMPAIGN */}
      {experienceTab === "campaign" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                <span>🏷️</span> {locale === "de" ? "Produktkampagne & Gold-Banner" : "Product Campaign & Gold Banner"}
              </span>
              <p className="text-[11px] text-muted mt-0.5">
                {locale === "de" ? "Hebt exklusive Deals und Promotionen direkt über dem Preis hervor." : "Highlights deals directly above the price on the product page."}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-gold">✨ KI</span>
          </div>

          {/* Campaign Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-muted">⚡ Presets:</span>
            {EXPERIENCE_PRESETS.campaigns.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    campaign: { ...prev.campaign, badge: preset.badge, message: preset.message },
                  }))
                }
                className="rounded-md border border-border/80 bg-surface-strong px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-gold/40 hover:bg-gold/10 hover:text-gold transition"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Live Banner Preview Box */}
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-gold/5 to-surface p-4 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
              <span>✨</span> {locale === "de" ? "Live-Vorschau auf Produktseite" : "Live Storefront Preview"}
            </span>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-black shadow-sm shrink-0">
                {experienceProfile.campaign.badge[locale] || experienceProfile.campaign.badge.de || (locale === "de" ? "Highlight" : "Highlight")}
              </span>
              <p className="text-xs font-medium text-foreground">
                {experienceProfile.campaign.message[locale] || experienceProfile.campaign.message.de || (locale === "de" ? "Kampagnen-Nachricht hier..." : "Campaign message here...")}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-muted">Badge DE</span>
              <input
                value={experienceProfile.campaign.badge.de}
                onChange={(e) =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    campaign: { ...prev.campaign, badge: { ...prev.campaign.badge, de: e.target.value } },
                  }))
                }
                placeholder="z. B. Sommer-Deal"
                className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-muted">Badge EN</span>
              <input
                value={experienceProfile.campaign.badge.en}
                onChange={(e) =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    campaign: { ...prev.campaign, badge: { ...prev.campaign.badge, en: e.target.value } },
                  }))
                }
                placeholder="e.g. Summer Deal"
                className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none transition-colors"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-muted">Message DE</span>
              <textarea
                rows={3}
                value={experienceProfile.campaign.message.de}
                onChange={(e) =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    campaign: { ...prev.campaign, message: { ...prev.campaign.message, de: e.target.value } },
                  }))
                }
                placeholder="z. B. Inklusive Gratis Panzerglas bei Abholung im Store."
                className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-xs text-foreground focus:border-gold focus:outline-none transition-colors"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-muted">Message EN</span>
              <textarea
                rows={3}
                value={experienceProfile.campaign.message.en}
                onChange={(e) =>
                  setExperienceProfile((prev) => ({
                    ...prev,
                    campaign: { ...prev.campaign, message: { ...prev.campaign.message, en: e.target.value } },
                  }))
                }
                placeholder="e.g. Free tempered glass screen protector included on store pickup."
                className="w-full rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-xs text-foreground focus:border-gold focus:outline-none transition-colors"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
