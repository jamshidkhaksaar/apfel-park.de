"use client";

import { useEffect, useMemo, useState } from "react";

import {
  PRODUCT_EXPERIENCE_SECTIONS,
  sanitizeProductExperienceProfile,
  type ProductExperienceProfile,
} from "@/lib/product-experience";

type Candidate = { id: string; title: string; brand?: string; model?: string; condition?: string; price: number; stock: number; images?: string[] };
type FamilyMember = { productId: string; optionValues: Record<string, string>; position: number; isActive: boolean };
type FamilyState = { id?: string; name: string; slug: string; optionAxes: string[]; isActive: boolean; members: FamilyMember[] };
type Tab = "features" | "family" | "contents" | "condition" | "trust" | "compare" | "campaign";

const labels: Record<Tab, { de: string; en: string }> = {
  features: { de: "Freigaben", en: "Features" }, family: { de: "Produktfamilie", en: "Product family" },
  contents: { de: "Lieferumfang", en: "Package contents" }, condition: { de: "Zustand & Fotos", en: "Condition & photos" },
  trust: { de: "Aufbereitung & Vertrauen", en: "Refurbishment & trust" }, compare: { de: "Vergleich & Bundles", en: "Comparison & bundles" },
  campaign: { de: "Kampagne", en: "Campaign" },
};
const sectionLabels: Record<string, { de: string; en: string }> = {
  familyConfigurator: { de: "Varianten-Konfigurator", en: "Variant configurator" }, packageContents: { de: "Lieferumfang", en: "Package contents" },
  conditionGuide: { de: "Zustandsvergleich", en: "Condition comparison" }, refurbishment: { de: "Aufbereitungsprozess", en: "Refurbishment process" },
  sizeComparison: { de: "Größenvergleich", en: "Size comparison" }, modelComparison: { de: "Modellvergleich", en: "Model comparison" },
  bundles: { de: "Kompatible Bundles", en: "Compatible bundles" }, campaign: { de: "Produktkampagne", en: "Product campaign" },
  tradeIn: { de: "Trade-in Anfrage", en: "Trade-in request" }, wishlist: { de: "Wunschliste", en: "Wishlist" },
};
const field = "w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground";
const parseRows = (value: string, columns: number) => value.split("\n").map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts.length >= columns && parts.some(Boolean));
const lines = (rows: string[][]) => rows.map((row) => row.join(" | ")).join("\n");

export default function ProductExperienceAdmin({ productId, locale }: { productId: string; locale: "de" | "en" }) {
  const de = locale === "de";
  const [tab, setTab] = useState<Tab>("features");
  const [profile, setProfile] = useState<ProductExperienceProfile>(() => sanitizeProductExperienceProfile({}));
  const [family, setFamily] = useState<FamilyState>({ name: "", slug: "", optionAxes: ["Speicher", "Farbe", "Zustand", "Akku"], isActive: false, members: [] });
  const [products, setProducts] = useState<Candidate[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [contentsText, setContentsText] = useState("");
  const [conditionText, setConditionText] = useState("");
  const [refurbishmentText, setRefurbishmentText] = useState("");
  const [trustText, setTrustText] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/products/${productId}/experience`).then((response) => response.json()).then((payload) => {
      if (!active || !payload.success) return;
      const next = sanitizeProductExperienceProfile(payload.profile);
      setProfile(next);
      setProducts(payload.products ?? []);
      setContentsText(lines(next.packageContents.map((item) => [item.label.de, item.label.en, item.included ? "yes" : "no"])));
      setConditionText(lines(next.conditionGuide.map((item) => [item.condition, item.label.de, item.label.en, item.description.de, item.description.en, item.imageUrls.join(",")])));
      setRefurbishmentText(lines(next.refurbishmentSteps.map((item) => [item.title.de, item.title.en, item.description.de, item.description.en])));
      setTrustText(lines(next.trustPoints.map((item) => [item.title.de, item.title.en, item.description.de, item.description.en])));
      if (payload.family) setFamily({
        id: payload.family.id, name: payload.family.name ?? "", slug: payload.family.slug ?? "",
        optionAxes: Array.isArray(payload.family.option_axes) ? payload.family.option_axes : [], isActive: Boolean(payload.family.is_active),
        members: (payload.family.members ?? []).map((member: Record<string, unknown>, index: number) => ({ productId: String(member.product_id), optionValues: member.option_values as Record<string, string> ?? {}, position: Number(member.position ?? index), isActive: member.is_active !== false })),
      });
    }).catch(() => setMessage(de ? "Produkt-Erlebnis konnte nicht geladen werden." : "Product experience could not be loaded."));
    return () => { active = false; };
  }, [de, productId]);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return products.filter((product) => !needle || `${product.title} ${product.brand ?? ""} ${product.model ?? ""}`.toLowerCase().includes(needle)).slice(0, 80);
  }, [products, query]);

  const toggleMember = (candidate: Candidate) => setFamily((previous) => {
    const exists = previous.members.some((member) => member.productId === candidate.id);
    return { ...previous, members: exists ? previous.members.filter((member) => member.productId !== candidate.id) : [...previous.members, { productId: candidate.id, optionValues: {}, position: previous.members.length, isActive: true }] };
  });

  const save = async () => {
    setSaving(true); setMessage("");
    const prepared = sanitizeProductExperienceProfile({
      ...profile,
      packageContents: parseRows(contentsText, 2).map(([labelDe, labelEn, included]) => ({ label: { de: labelDe, en: labelEn }, included: included.toLowerCase() !== "no" })),
      conditionGuide: parseRows(conditionText, 5).map(([condition, labelDe, labelEn, descriptionDe, descriptionEn, urls]) => ({ condition, label: { de: labelDe, en: labelEn }, description: { de: descriptionDe, en: descriptionEn }, imageUrls: (urls ?? "").split(",").map((url) => url.trim()).filter(Boolean) })),
      refurbishmentSteps: parseRows(refurbishmentText, 4).map(([titleDe, titleEn, descriptionDe, descriptionEn]) => ({ title: { de: titleDe, en: titleEn }, description: { de: descriptionDe, en: descriptionEn } })),
      trustPoints: parseRows(trustText, 4).map(([titleDe, titleEn, descriptionDe, descriptionEn]) => ({ title: { de: titleDe, en: titleEn }, description: { de: descriptionDe, en: descriptionEn } })),
    });
    try {
      const response = await fetch(`/api/admin/products/${productId}/experience`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: prepared, family }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "save_failed");
      setProfile(prepared); setFamily((previous) => ({ ...previous, id: payload.familyId || undefined }));
      setMessage(de ? "Professionelles Produkt-Erlebnis gespeichert." : "Professional product experience saved.");
    } catch (error) { setMessage(`${de ? "Speichern fehlgeschlagen" : "Save failed"}: ${error instanceof Error ? error.message : ""}`); }
    finally { setSaving(false); }
  };

  const updateDimension = (key: keyof ProductExperienceProfile["dimensions"], value: string) => setProfile((previous) => ({ ...previous, dimensions: { ...previous.dimensions, [key]: value ? Number(value) : undefined } }));
  const selection = (key: "comparisonProductIds" | "bundleProductIds", id: string) => setProfile((previous) => ({ ...previous, [key]: previous[key].includes(id) ? previous[key].filter((entry) => entry !== id) : [...previous[key], id] }));

  return <section className="mx-auto mt-6 w-full max-w-[1500px] rounded-2xl border border-border bg-surface/50 p-4 sm:p-6" aria-labelledby="professional-product-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">reBuy-level tools</p><h2 id="professional-product-heading" className="mt-1 text-xl font-semibold text-foreground">{de ? "Professionelles Produkt-Erlebnis" : "Professional product experience"}</h2><p className="mt-1 text-sm text-muted">{de ? "Alle Bereiche sind standardmäßig verborgen und müssen bewusst freigegeben werden." : "All sections are hidden by default and must be explicitly enabled."}</p></div><button type="button" onClick={save} disabled={saving} className="btn-primary min-h-11 px-5">{saving ? (de ? "Speichern …" : "Saving …") : (de ? "Alles speichern" : "Save all")}</button></div>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="tablist">{(Object.keys(labels) as Tab[]).map((key) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium ${tab === key ? "border-gold/60 bg-gold/10 text-gold" : "border-border text-muted"}`}>{labels[key][locale]}</button>)}</div>

    {tab === "features" ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{PRODUCT_EXPERIENCE_SECTIONS.map((section) => <label key={section} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4"><span className="text-sm font-medium text-foreground">{sectionLabels[section][locale]}</span><input type="checkbox" checked={profile.enabledSections[section]} onChange={(event) => setProfile((previous) => ({ ...previous, enabledSections: { ...previous.enabledSections, [section]: event.target.checked } }))} className="size-5 accent-gold" /></label>)}</div> : null}

    {tab === "family" ? <div className="mt-5 space-y-4"><div className="grid gap-3 md:grid-cols-2"><label className="text-sm text-muted">{de ? "Familienname" : "Family name"}<input className={`${field} mt-1`} value={family.name} onChange={(event) => setFamily((previous) => ({ ...previous, name: event.target.value }))} /></label><label className="text-sm text-muted">Slug<input className={`${field} mt-1`} value={family.slug} onChange={(event) => setFamily((previous) => ({ ...previous, slug: event.target.value }))} /></label></div><label className="text-sm text-muted">{de ? "Optionen, kommagetrennt" : "Option axes, comma separated"}<input className={`${field} mt-1`} value={family.optionAxes.join(", ")} onChange={(event) => setFamily((previous) => ({ ...previous, optionAxes: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) }))} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={family.isActive} onChange={(event) => setFamily((previous) => ({ ...previous, isActive: event.target.checked }))} />{de ? "Familie im Shop aktiv" : "Family active in store"}</label><input className={field} placeholder={de ? "Produkte suchen …" : "Search products …"} value={query} onChange={(event) => setQuery(event.target.value)} /><div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-2">{filtered.map((candidate) => { const member = family.members.find((entry) => entry.productId === candidate.id); return <div key={candidate.id} className="rounded-lg border border-border/40 p-3"><label className="flex items-center gap-3"><input type="checkbox" checked={Boolean(member)} onChange={() => toggleMember(candidate)} /><span className="min-w-0 flex-1 text-sm font-medium text-foreground">{candidate.title}</span><span className="text-xs text-muted">{candidate.stock}× · {candidate.price} €</span></label>{member ? <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{family.optionAxes.map((axis) => <label key={axis} className="text-xs text-muted">{axis}<input className={`${field} mt-1`} value={member.optionValues[axis] ?? ""} onChange={(event) => setFamily((previous) => ({ ...previous, members: previous.members.map((entry) => entry.productId === candidate.id ? { ...entry, optionValues: { ...entry.optionValues, [axis]: event.target.value } } : entry) }))} /></label>)}</div> : null}</div>; })}</div></div> : null}

    {tab === "contents" ? <div className="mt-5"><p className="mb-2 text-sm text-muted">{de ? "Eine Zeile: Deutsch | Englisch | yes/no" : "One row: German | English | yes/no"}</p><textarea rows={10} className={field} value={contentsText} onChange={(event) => setContentsText(event.target.value)} placeholder="USB-C Kabel | USB-C cable | yes" /></div> : null}
    {tab === "condition" ? <div className="mt-5"><p className="mb-2 text-sm text-muted">condition | label DE | label EN | Beschreibung DE | Description EN | image URLs</p><textarea rows={12} className={field} value={conditionText} onChange={(event) => setConditionText(event.target.value)} placeholder="open_box | Open-Box | Open box | Geöffnet, kaum benutzt | Opened, barely used | /uploads/..." /></div> : null}
    {tab === "trust" ? <div className="mt-5 grid gap-5 lg:grid-cols-2"><label className="text-sm text-muted">{de ? "Aufbereitungsschritte" : "Refurbishment steps"}<textarea rows={10} className={`${field} mt-2`} value={refurbishmentText} onChange={(event) => setRefurbishmentText(event.target.value)} placeholder="Prüfung | Testing | Technisch geprüft | Technically tested" /></label><label className="text-sm text-muted">{de ? "Vertrauenspunkte" : "Trust points"}<textarea rows={10} className={`${field} mt-2`} value={trustText} onChange={(event) => setTrustText(event.target.value)} placeholder="Echte Fotos | Real photos | Fotos dieses Geräts | Photos of this unit" /></label></div> : null}
    {tab === "compare" ? <div className="mt-5 space-y-5"><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{(["heightMm","widthMm","depthMm","weightG","screenInches"] as const).map((key) => <label key={key} className="text-xs text-muted">{key}<input type="number" min="0" step="0.1" className={`${field} mt-1`} value={profile.dimensions[key] ?? ""} onChange={(event) => updateDimension(key, event.target.value)} /></label>)}</div><div className="grid gap-5 lg:grid-cols-2">{(["comparisonProductIds","bundleProductIds"] as const).map((key) => <div key={key}><h3 className="text-sm font-semibold text-foreground">{key === "comparisonProductIds" ? (de ? "Vergleichsprodukte" : "Comparison products") : (de ? "Kompatible Bundles" : "Compatible bundles")}</h3><div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border/60 p-2">{filtered.map((candidate) => <label key={candidate.id} className="flex items-center gap-2 border-b border-border/30 px-2 py-2 text-sm"><input type="checkbox" checked={profile[key].includes(candidate.id)} onChange={() => selection(key, candidate.id)} /><span className="line-clamp-1">{candidate.title}</span></label>)}</div></div>)}</div></div> : null}
    {tab === "campaign" ? <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm text-muted">Badge DE<input className={`${field} mt-1`} value={profile.campaign.badge.de} onChange={(event) => setProfile((previous) => ({ ...previous, campaign: { ...previous.campaign, badge: { ...previous.campaign.badge, de: event.target.value } } }))} /></label><label className="text-sm text-muted">Badge EN<input className={`${field} mt-1`} value={profile.campaign.badge.en} onChange={(event) => setProfile((previous) => ({ ...previous, campaign: { ...previous.campaign, badge: { ...previous.campaign.badge, en: event.target.value } } }))} /></label><label className="text-sm text-muted">Message DE<textarea rows={4} className={`${field} mt-1`} value={profile.campaign.message.de} onChange={(event) => setProfile((previous) => ({ ...previous, campaign: { ...previous.campaign, message: { ...previous.campaign.message, de: event.target.value } } }))} /></label><label className="text-sm text-muted">Message EN<textarea rows={4} className={`${field} mt-1`} value={profile.campaign.message.en} onChange={(event) => setProfile((previous) => ({ ...previous, campaign: { ...previous.campaign, message: { ...previous.campaign.message, en: event.target.value } } }))} /></label></div> : null}
    {message ? <p className="mt-4 text-sm text-muted" role="status">{message}</p> : null}
  </section>;
}
