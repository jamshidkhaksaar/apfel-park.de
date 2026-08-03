"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import type { RepairCatalog, RepairCatalogModel } from "@/lib/repair-catalog";
import {
  addDays,
  calculateEstimateTotals,
  type RepairEstimatePayload,
  type RepairEstimateRow,
  type RepairEstimateTemplateSettings,
} from "@/lib/repair-estimates";

type EstimateVersion = { revision: number; issued_at: string };
type RepairOption = {
  id: string;
  ticketNumber: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerLocale: string;
  deviceModel: string;
  issueDescription: string;
};

type Props = {
  locale: "de" | "en";
  catalog: RepairCatalog;
  settings: RepairEstimateTemplateSettings;
  initialPayload: RepairEstimatePayload;
  initialEstimate?: RepairEstimateRow | null;
  versions?: EstimateVersion[];
  repairOptions: RepairOption[];
  initialRepairId?: string | null;
};

const fieldClass = "w-full rounded-xl border border-border/70 bg-background/75 px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted/50 focus:border-gold/60 focus:ring-2 focus:ring-gold/15";
const labelClass = "mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-muted";

const euro = (cents: number, locale: "de" | "en") => new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR" }).format(cents / 100);
const deviceName = (payload: RepairEstimatePayload) => [payload.device.brand, payload.device.model].filter(Boolean).join(" ");

function Section({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-surface/65 p-5 shadow-[0_14px_45px_rgba(0,0,0,0.08)] sm:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-border/50 pb-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold/10 text-xs font-bold text-gold">{number}</span>
        <div><h2 className="text-lg font-semibold text-foreground">{title}</h2><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div>
      </div>
      {children}
    </section>
  );
}

export default function RepairEstimateEditor({
  locale,
  catalog,
  settings,
  initialPayload,
  initialEstimate = null,
  versions = [],
  repairOptions,
  initialRepairId = null,
}: Props) {
  const router = useRouter();
  const [estimate, setEstimate] = useState<RepairEstimateRow | null>(initialEstimate);
  const [payload, setPayload] = useState(initialPayload);
  const [repairId, setRepairId] = useState(initialRepairId || initialEstimate?.repair_id || "");
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialPayload));
  const [busy, setBusy] = useState<"save" | "issue" | "email" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saveDefaults, setSaveDefaults] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [emailCustomer, setEmailCustomer] = useState(true);
  const [emailInsurer, setEmailInsurer] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const dirty = JSON.stringify(payload) !== savedSnapshot;
  const totals = useMemo(() => calculateEstimateTotals(payload), [payload]);
  const isGerman = locale === "de";
  const t = isGerman ? {
    back: "Kostenvoranschläge", newTitle: "Neuer Kostenvoranschlag", editTitle: "Kostenvoranschlag bearbeiten",
    save: "Entwurf speichern", saving: "Speichert …", issue: "Offiziell ausstellen", issuing: "Wird erstellt …", pdf: "PDF öffnen", download: "PDF herunterladen",
    unsaved: "Nicht gespeicherte Änderungen", saved: "Gespeichert", recipient: "Empfänger & Vorgang", recipientHelp: "Kundendaten und optional den Versicherungs- oder Garantieempfänger erfassen.",
    repair: "Reparaturticket", customer: "Kunde", insurer: "Versicherung / Garantie", useInsurer: "Versicherung als Empfänger verwenden", claim: "Schadennummer",
    name: "Name / Firma", contact: "Ansprechpartner", email: "E-Mail", phone: "Telefon", street: "Straße und Hausnummer", zip: "PLZ", city: "Ort", country: "Land",
    device: "Gerät & Schadensbild", deviceHelp: "Gerät aus dem Preis-Katalog auswählen und die technische Feststellung dokumentieren.", brand: "Marke", family: "Gerätefamilie", model: "Modell", serial: "Seriennummer / IMEI", assessment: "Schadensfeststellung",
    pricing: "Leistungen & Preise", pricingHelp: "Katalogteile übernehmen oder individuelle Werkstattleistungen ergänzen. Alle Eingabepreise sind brutto.", part: "Ersatzteil / Leistung", variant: "Qualität / Variante", addCatalog: "Katalogposition hinzufügen", addCustom: "Freie Position", description: "Beschreibung", qty: "Menge", grossUnit: "Einzelpreis brutto", remove: "Entfernen",
    document: "Dokument & Zahlung", documentHelp: "Sprache, Gültigkeit, Briefkopf und Bankverbindung für diese Version festlegen.", language: "Dokumentsprache", issued: "Ausstellungsdatum", valid: "Gültig bis", issuer: "Ausstellertext", bank: "Bank", holder: "Kontoinhaber", reference: "Verwendungszweck", footer: "Hinweistext", defaults: "Diese Briefkopf- und Bankdaten als Standard speichern",
    preview: "Dokumentvorschau", net: "Zwischensumme netto", vat: "MwSt.", gross: "Gesamtsumme brutto", payment: "Zahlungsinformationen", validTo: "Gültig bis", noItems: "Noch keine Positionen",
    delivery: "Versand & Status", deliveryHelp: "Die zuletzt ausgestellte, unveränderte PDF-Version versenden.", send: "PDF per E-Mail senden", sending: "Sendet …", toCustomer: "An Kunde", toInsurer: "An Versicherung", emailNote: "Optionale Nachricht", history: "Ausgestellte Versionen", accepted: "Als angenommen markieren", declined: "Als abgelehnt markieren",
  } : {
    back: "Repair estimates", newTitle: "New repair estimate", editTitle: "Edit repair estimate",
    save: "Save draft", saving: "Saving …", issue: "Issue officially", issuing: "Creating …", pdf: "Open PDF", download: "Download PDF",
    unsaved: "Unsaved changes", saved: "Saved", recipient: "Recipient & case", recipientHelp: "Capture the customer and optional insurance or warranty recipient.",
    repair: "Repair ticket", customer: "Customer", insurer: "Insurance / warranty", useInsurer: "Use insurer as recipient", claim: "Claim number",
    name: "Name / company", contact: "Contact person", email: "Email", phone: "Phone", street: "Street and number", zip: "Postcode", city: "City", country: "Country",
    device: "Device & assessment", deviceHelp: "Select the device from the pricing catalog and record the technical assessment.", brand: "Brand", family: "Device family", model: "Model", serial: "Serial number / IMEI", assessment: "Damage assessment",
    pricing: "Services & prices", pricingHelp: "Use catalog parts or add custom workshop services. All entered prices are gross.", part: "Part / service", variant: "Quality / variant", addCatalog: "Add catalog item", addCustom: "Custom item", description: "Description", qty: "Qty", grossUnit: "Unit price gross", remove: "Remove",
    document: "Document & payment", documentHelp: "Set the language, validity, letterhead, and bank details for this version.", language: "Document language", issued: "Issue date", valid: "Valid until", issuer: "Issuer text", bank: "Bank", holder: "Account holder", reference: "Payment reference", footer: "Document note", defaults: "Save these letterhead and bank details as defaults",
    preview: "Document preview", net: "Subtotal net", vat: "VAT", gross: "Total gross", payment: "Payment information", validTo: "Valid until", noItems: "No items added yet",
    delivery: "Delivery & status", deliveryHelp: "Send the latest issued and unchanged PDF revision.", send: "Send PDF by email", sending: "Sending …", toCustomer: "To customer", toInsurer: "To insurer", emailNote: "Optional message", history: "Issued revisions", accepted: "Mark accepted", declined: "Mark declined",
  };

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const selectedBrand = catalog.brands.find((brand) => brand.id === payload.device.brandId) || null;
  const eligibleFamilies = selectedBrand?.families.filter((family) => {
    const source = `${family.type || ""} ${family.id} ${family.name}`.toLowerCase();
    return family.type === "phone" || family.type === "tablet" || /phone|iphone|pixel|galaxy|redmi|xiaomi|poco|ipad|tablet|tab/.test(source);
  }) || [];
  const selectedFamily = eligibleFamilies.find((family) => family.id === payload.device.familyId) || null;
  const selectedModel: RepairCatalogModel | null = selectedFamily?.models.find((model) => model.id === payload.device.modelId) || null;
  const selectedPart = selectedModel?.parts?.find((part) => part.id === selectedPartId) || null;
  const selectedVariant = selectedPart?.variants.find((variant) => variant.id === selectedVariantId) || null;

  const update = <K extends keyof RepairEstimatePayload>(key: K, value: RepairEstimatePayload[K]) => setPayload((current) => ({ ...current, [key]: value }));
  const updateCustomer = (key: keyof RepairEstimatePayload["customer"], value: string) => setPayload((current) => ({ ...current, customer: { ...current.customer, [key]: value } }));
  const updateInsurer = (key: keyof RepairEstimatePayload["insurer"], value: string | boolean) => setPayload((current) => ({ ...current, insurer: { ...current.insurer, [key]: value } }));

  const selectRepair = (id: string) => {
    setRepairId(id);
    const repair = repairOptions.find((item) => item.id === id);
    if (!repair) return;
    setPayload((current) => ({
      ...current,
      language: repair.customerLocale === "en" ? "en" : "de",
      repairTicket: repair.ticketNumber ? `R-${repair.ticketNumber}` : "",
      customer: { ...current.customer, name: repair.customerName, email: repair.customerEmail, phone: repair.customerPhone },
      device: { ...current.device, model: repair.deviceModel },
      damageAssessment: repair.issueDescription,
    }));
  };

  const selectBrand = (brandId: string) => {
    const brand = catalog.brands.find((item) => item.id === brandId);
    setPayload((current) => ({ ...current, device: { ...current.device, brandId, brand: brand?.name || "", familyId: "", family: "", modelId: "", model: "" } }));
    setSelectedPartId(""); setSelectedVariantId("");
  };
  const selectFamily = (familyId: string) => {
    const family = eligibleFamilies.find((item) => item.id === familyId);
    setPayload((current) => ({ ...current, device: { ...current.device, familyId, family: family?.name || "", modelId: "", model: "" } }));
    setSelectedPartId(""); setSelectedVariantId("");
  };
  const selectModel = (modelId: string) => {
    const model = selectedFamily?.models.find((item) => item.id === modelId);
    setPayload((current) => ({ ...current, device: { ...current.device, modelId, model: model?.name || "" } }));
    setSelectedPartId(""); setSelectedVariantId("");
  };

  const addCatalogItem = () => {
    if (!selectedBrand || !selectedFamily || !selectedModel || !selectedPart || !selectedVariant) return;
    const description = `${selectedPart.name} - ${selectedVariant.label}`;
    setPayload((current) => ({ ...current, items: [...current.items, {
      id: crypto.randomUUID(), description, quantity: 1,
      grossUnitCents: Math.max(0, Math.round((selectedVariant.price || 0) * 100)),
      catalog: { brandId: selectedBrand.id, familyId: selectedFamily.id, modelId: selectedModel.id, partId: selectedPart.id, variantId: selectedVariant.id, quality: selectedVariant.quality },
    }] }));
  };
  const addCustomItem = () => setPayload((current) => ({ ...current, items: [...current.items, { id: crypto.randomUUID(), description: "", quantity: 1, grossUnitCents: 0 }] }));
  const changeItem = (id: string, changes: Partial<RepairEstimatePayload["items"][number]>) => setPayload((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, ...changes } : item) }));

  const saveDraft = async (): Promise<RepairEstimateRow | null> => {
    setBusy("save"); setMessage(null);
    try {
      if (saveDefaults) {
        const settingsResponse = await fetch("/api/admin/repair-estimates/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, issuerText: payload.issuerText, bankName: payload.bankName, accountHolder: payload.accountHolder, iban: payload.iban, bic: payload.bic, vatRateBps: payload.vatRateBps }) });
        if (!settingsResponse.ok) throw new Error((await settingsResponse.json()).error || "Failed to save defaults");
      }
      const response = await fetch(estimate ? `/api/admin/repair-estimates/${estimate.id}` : "/api/admin/repair-estimates", {
        method: estimate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estimate ? { payload, versionToken: estimate.version_token } : { payload, repairId: repairId || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      const next = data.estimate as RepairEstimateRow;
      setEstimate(next); setSavedSnapshot(JSON.stringify(payload));
      setMessage({ type: "success", text: isGerman ? "Entwurf gespeichert." : "Draft saved." });
      if (!estimate) router.replace(`/admin/repair-estimates/${next.id}`);
      router.refresh();
      return next;
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Save failed" });
      return null;
    } finally { setBusy(null); }
  };

  const issue = async () => {
    const current = dirty || !estimate ? await saveDraft() : estimate;
    if (!current) return;
    setBusy("issue"); setMessage(null);
    try {
      const response = await fetch(`/api/admin/repair-estimates/${current.id}/issue`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ versionToken: current.version_token }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Issue failed");
      setEstimate((value) => value ? { ...value, status: "issued", current_revision: Number(data.version.revision), version_token: Number(data.version.version_token) } : value);
      setMessage({ type: "success", text: isGerman ? "PDF wurde offiziell ausgestellt." : "PDF issued successfully." });
      router.refresh();
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Issue failed" }); }
    finally { setBusy(null); }
  };

  const sendEmail = async () => {
    if (!estimate?.current_revision) return;
    setBusy("email"); setMessage(null);
    try {
      const response = await fetch(`/api/admin/repair-estimates/${estimate.id}/email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: emailCustomer, insurer: emailInsurer, message: emailMessage, revision: estimate.current_revision }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Email failed");
      setMessage({ type: "success", text: isGerman ? `PDF gesendet an ${data.recipients.join(", ")}.` : `PDF sent to ${data.recipients.join(", ")}.` });
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Email failed" }); }
    finally { setBusy(null); }
  };

  const markStatus = async (status: "accepted" | "declined") => {
    if (!estimate) return;
    const response = await fetch(`/api/admin/repair-estimates/${estimate.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload, versionToken: estimate.version_token, status }) });
    const data = await response.json();
    if (response.ok) { setEstimate(data.estimate); setMessage({ type: "success", text: status }); router.refresh(); }
    else setMessage({ type: "error", text: data.error || "Update failed" });
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0"><Link href="/admin/repair-estimates" className="text-xs text-muted hover:text-gold">← {t.back}</Link><h1 className="mt-1 truncate text-xl font-semibold text-foreground">{estimate?.estimate_number || t.newTitle}</h1></div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs ${dirty ? "text-amber-300" : "text-muted"}`}>{dirty ? t.unsaved : t.saved}</span>
            {estimate ? <button type="button" className="btn-secondary" onClick={() => window.open(`/api/admin/repair-estimates/${estimate.id}/pdf${estimate.current_revision ? `?revision=${estimate.current_revision}` : ""}`, "_blank")}>{t.pdf}</button> : null}
            {estimate ? <button type="button" className="btn-secondary" onClick={() => window.open(`/api/admin/repair-estimates/${estimate.id}/pdf?${estimate.current_revision ? `revision=${estimate.current_revision}&` : ""}download=1`, "_blank")}>{t.download}</button> : null}
            <button type="button" className="btn-secondary" disabled={Boolean(busy)} onClick={() => void saveDraft()}>{busy === "save" ? t.saving : t.save}</button>
            <button type="button" className="btn-primary" disabled={Boolean(busy)} onClick={() => void issue()}>{busy === "issue" ? t.issuing : t.issue}</button>
          </div>
        </div>
      </div>

      {message ? <div className={`rounded-xl border p-4 text-sm ${message.type === "success" ? "border-green-400/30 bg-green-400/10 text-green-300" : "border-red-400/30 bg-red-400/10 text-red-300"}`}>{message.text}</div> : null}

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-5">
          <Section number="01" title={t.recipient} description={t.recipientHelp}>
            <label className={labelClass}>{t.repair}</label>
            <select value={repairId} onChange={(event) => selectRepair(event.target.value)} className={fieldClass} disabled={Boolean(initialEstimate)}>
              <option value="">{isGerman ? "Ohne Ticket / eigenständig" : "Standalone / no ticket"}</option>
              {repairOptions.map((repair) => <option key={repair.id} value={repair.id}>{repair.ticketNumber ? `R-${repair.ticketNumber}` : "R"} · {repair.customerName} · {repair.deviceModel}</option>)}
            </select>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className={labelClass}>{t.customer} · {t.name}</label><input className={fieldClass} value={payload.customer.name} onChange={(e) => updateCustomer("name", e.target.value)} /></div>
              <div><label className={labelClass}>{t.email}</label><input type="email" className={fieldClass} value={payload.customer.email} onChange={(e) => updateCustomer("email", e.target.value)} /></div>
              <div><label className={labelClass}>{t.phone}</label><input className={fieldClass} value={payload.customer.phone} onChange={(e) => updateCustomer("phone", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={labelClass}>{t.street}</label><input className={fieldClass} value={payload.customer.street} onChange={(e) => updateCustomer("street", e.target.value)} /></div>
              <div><label className={labelClass}>{t.zip}</label><input className={fieldClass} value={payload.customer.postalCode} onChange={(e) => updateCustomer("postalCode", e.target.value)} /></div>
              <div><label className={labelClass}>{t.city}</label><input className={fieldClass} value={payload.customer.city} onChange={(e) => updateCustomer("city", e.target.value)} /></div>
            </div>
            <label className="mt-6 flex items-center gap-3 rounded-xl border border-border/60 bg-background/45 p-3 text-sm text-foreground"><input type="checkbox" checked={payload.insurer.enabled} onChange={(e) => updateInsurer("enabled", e.target.checked)} className="accent-[#b88721]" />{t.useInsurer}</label>
            {payload.insurer.enabled ? <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className={labelClass}>{t.insurer} · {t.name}</label><input className={fieldClass} value={payload.insurer.name} onChange={(e) => updateInsurer("name", e.target.value)} /></div>
              <div><label className={labelClass}>{t.contact}</label><input className={fieldClass} value={payload.insurer.contactName} onChange={(e) => updateInsurer("contactName", e.target.value)} /></div>
              <div><label className={labelClass}>{t.email}</label><input type="email" className={fieldClass} value={payload.insurer.email} onChange={(e) => updateInsurer("email", e.target.value)} /></div>
              <div><label className={labelClass}>{t.claim}</label><input className={fieldClass} value={payload.insurer.claimNumber} onChange={(e) => updateInsurer("claimNumber", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={labelClass}>{t.street}</label><input className={fieldClass} value={payload.insurer.street} onChange={(e) => updateInsurer("street", e.target.value)} /></div>
              <div><label className={labelClass}>{t.zip}</label><input className={fieldClass} value={payload.insurer.postalCode} onChange={(e) => updateInsurer("postalCode", e.target.value)} /></div>
              <div><label className={labelClass}>{t.city}</label><input className={fieldClass} value={payload.insurer.city} onChange={(e) => updateInsurer("city", e.target.value)} /></div>
            </div> : null}
          </Section>

          <Section number="02" title={t.device} description={t.deviceHelp}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className={labelClass}>{t.brand}</label><select className={fieldClass} value={payload.device.brandId} onChange={(e) => selectBrand(e.target.value)}><option value="">—</option>{catalog.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
              <div><label className={labelClass}>{t.family}</label><select className={fieldClass} value={payload.device.familyId} onChange={(e) => selectFamily(e.target.value)}><option value="">—</option>{eligibleFamilies.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}</select></div>
              <div><label className={labelClass}>{t.model}</label><select className={fieldClass} value={payload.device.modelId} onChange={(e) => selectModel(e.target.value)}><option value="">—</option>{selectedFamily?.models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select></div>
              <div className="sm:col-span-2"><label className={labelClass}>{isGerman ? "Gerätename (bearbeitbar)" : "Device name (editable)"}</label><input className={fieldClass} value={payload.device.model} onChange={(e) => setPayload((current) => ({ ...current, device: { ...current.device, model: e.target.value } }))} /></div>
              <div><label className={labelClass}>{t.serial}</label><input className={fieldClass} value={payload.device.serialNumber} onChange={(e) => setPayload((current) => ({ ...current, device: { ...current.device, serialNumber: e.target.value } }))} /></div>
              <div className="sm:col-span-3"><label className={labelClass}>{t.assessment}</label><textarea className={`${fieldClass} min-h-32 resize-y`} value={payload.damageAssessment} onChange={(e) => update("damageAssessment", e.target.value)} /></div>
            </div>
          </Section>

          <Section number="03" title={t.pricing} description={t.pricingHelp}>
            <div className="grid gap-3 rounded-xl border border-border/60 bg-background/45 p-4 sm:grid-cols-[1fr_1fr_auto]">
              <div><label className={labelClass}>{t.part}</label><select className={fieldClass} value={selectedPartId} onChange={(e) => { setSelectedPartId(e.target.value); setSelectedVariantId(""); }}><option value="">—</option>{selectedModel?.parts?.map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}</select></div>
              <div><label className={labelClass}>{t.variant}</label><select className={fieldClass} value={selectedVariantId} onChange={(e) => setSelectedVariantId(e.target.value)}><option value="">—</option>{selectedPart?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label} · {variant.price === null ? (isGerman ? "Preis offen" : "No price") : euro(Math.round(variant.price * 100), locale)}</option>)}</select></div>
              <button type="button" className="btn-secondary self-end" disabled={!selectedVariant} onClick={addCatalogItem}>{t.addCatalog}</button>
            </div>
            <div className="mt-4 space-y-3">{payload.items.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-border/60 bg-background/40 p-3 sm:grid-cols-[minmax(0,1fr)_80px_150px_auto]">
              <div><label className={labelClass}>{t.description}</label><input className={fieldClass} value={item.description} onChange={(e) => changeItem(item.id, { description: e.target.value })} /></div>
              <div><label className={labelClass}>{t.qty}</label><input type="number" min="1" max="100" className={fieldClass} value={item.quantity} onChange={(e) => changeItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })} /></div>
              <div><label className={labelClass}>{t.grossUnit}</label><input inputMode="decimal" className={fieldClass} value={(item.grossUnitCents / 100).toFixed(2)} onChange={(e) => changeItem(item.id, { grossUnitCents: Math.max(0, Math.round((Number(e.target.value.replace(",", ".")) || 0) * 100)) })} /></div>
              <button type="button" className="self-end rounded-xl border border-red-400/25 px-3 py-2.5 text-xs text-red-300 hover:bg-red-400/10" onClick={() => setPayload((current) => ({ ...current, items: current.items.filter((row) => row.id !== item.id) }))}>{t.remove}</button>
            </div>)}</div>
            <button type="button" className="mt-4 text-sm font-semibold text-gold hover:text-foreground" onClick={addCustomItem}>+ {t.addCustom}</button>
          </Section>

          <Section number="04" title={t.document} description={t.documentHelp}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelClass}>{t.language}</label><select className={fieldClass} value={payload.language} onChange={(e) => update("language", e.target.value === "en" ? "en" : "de")}><option value="de">Deutsch</option><option value="en">English</option></select></div>
              <div className="grid grid-cols-2 gap-3"><div><label className={labelClass}>{t.issued}</label><input type="date" className={fieldClass} value={payload.issueDate} onChange={(e) => setPayload((current) => ({ ...current, issueDate: e.target.value, validUntil: addDays(e.target.value, settings.validityDays) }))} /></div><div><label className={labelClass}>{t.valid}</label><input type="date" className={fieldClass} value={payload.validUntil} onChange={(e) => update("validUntil", e.target.value)} /></div></div>
              <div className="sm:col-span-2"><label className={labelClass}>{t.issuer}</label><textarea className={`${fieldClass} min-h-20`} value={payload.issuerText} onChange={(e) => update("issuerText", e.target.value)} /></div>
              <div><label className={labelClass}>{t.bank}</label><input className={fieldClass} value={payload.bankName} onChange={(e) => update("bankName", e.target.value)} /></div>
              <div><label className={labelClass}>{t.holder}</label><input className={fieldClass} value={payload.accountHolder} onChange={(e) => update("accountHolder", e.target.value)} placeholder={isGerman ? "Vor Ausstellung erforderlich" : "Required before issue"} /></div>
              <div><label className={labelClass}>IBAN</label><input className={fieldClass} value={payload.iban} onChange={(e) => update("iban", e.target.value.toUpperCase())} /></div>
              <div><label className={labelClass}>BIC</label><input className={fieldClass} value={payload.bic} onChange={(e) => update("bic", e.target.value.toUpperCase())} /></div>
              <div className="sm:col-span-2"><label className={labelClass}>{t.reference}</label><input className={fieldClass} value={payload.paymentReference} onChange={(e) => update("paymentReference", e.target.value)} placeholder={estimate?.estimate_number || payload.insurer.claimNumber || "KVA-…"} /></div>
              <div className="sm:col-span-2"><label className={labelClass}>{t.footer}</label><textarea className={`${fieldClass} min-h-24`} value={payload.footerNote} onChange={(e) => update("footerNote", e.target.value)} /></div>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-foreground"><input type="checkbox" checked={saveDefaults} onChange={(e) => setSaveDefaults(e.target.checked)} className="accent-[#b88721]" />{t.defaults}</label>
          </Section>

          {estimate?.current_revision ? <Section number="05" title={t.delivery} description={t.deliveryHelp}>
            <div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={emailCustomer} onChange={(e) => setEmailCustomer(e.target.checked)} className="accent-[#b88721]" />{t.toCustomer} ({payload.customer.email || "—"})</label>{payload.insurer.enabled ? <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={emailInsurer} onChange={(e) => setEmailInsurer(e.target.checked)} className="accent-[#b88721]" />{t.toInsurer} ({payload.insurer.email || "—"})</label> : null}</div>
            <textarea className={`${fieldClass} mt-4 min-h-24`} value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder={t.emailNote} />
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="btn-primary" onClick={() => void sendEmail()} disabled={Boolean(busy)}>{busy === "email" ? t.sending : t.send}</button><button type="button" className="btn-secondary" onClick={() => void markStatus("accepted")}>{t.accepted}</button><button type="button" className="btn-secondary" onClick={() => void markStatus("declined")}>{t.declined}</button></div>
            <div className="mt-6 border-t border-border/60 pt-4"><p className={labelClass}>{t.history}</p><div className="flex flex-wrap gap-2">{versions.map((version) => <a key={version.revision} className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted hover:border-gold/40 hover:text-gold" href={`/api/admin/repair-estimates/${estimate.id}/pdf?revision=${version.revision}`} target="_blank">R{version.revision} · {new Date(version.issued_at).toLocaleDateString()}</a>)}</div></div>
          </Section> : null}
        </div>

        <aside className="2xl:sticky 2xl:top-24">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{t.preview}</p>
          <div className="mx-auto aspect-[1/1.414] w-full max-w-[430px] overflow-hidden rounded-sm bg-white p-[7%] text-[#252525] shadow-[0_30px_90px_rgba(0,0,0,0.28)] ring-1 ring-black/10">
            <div className="flex items-start justify-between border-b-2 border-[#b88721] pb-4"><div className="flex items-center gap-3"><Image src="/uploads/branding/logo.png" alt="Apfel Park" width={48} height={48} className="h-12 w-12 object-contain" /><div><p className="text-[12px] font-bold tracking-[0.14em]">APFEL PARK</p><p className="mt-1 whitespace-pre-line text-[7px] leading-3 text-[#666]">{payload.issuerText}</p></div></div><div className="text-right"><p className="text-[11px] font-bold text-[#b88721]">{payload.language === "de" ? "KOSTENVORANSCHLAG" : "REPAIR COST ESTIMATE"}</p><p className="mt-2 text-[7px]">{estimate?.estimate_number || "KVA-YYYY-####"}</p><p className="text-[7px]">{t.validTo}: {payload.validUntil}</p></div></div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-[7px] leading-3"><div><p className="font-bold uppercase tracking-widest text-[#b88721]">{payload.insurer.enabled ? t.insurer : t.customer}</p><p className="mt-1 font-bold">{payload.insurer.enabled ? payload.insurer.name : payload.customer.name || "—"}</p><p>{payload.insurer.enabled ? payload.insurer.street : payload.customer.street}</p><p>{payload.insurer.enabled ? `${payload.insurer.postalCode} ${payload.insurer.city}` : `${payload.customer.postalCode} ${payload.customer.city}`}</p></div>{payload.insurer.enabled ? <div><p className="font-bold uppercase tracking-widest text-[#b88721]">{t.customer}</p><p className="mt-1 font-bold">{payload.customer.name}</p><p>{t.claim}: {payload.insurer.claimNumber || "—"}</p></div> : null}</div>
            <div className="mt-5 rounded bg-[#f6f2e8] p-3"><p className="text-[6px] font-bold uppercase tracking-widest text-[#b88721]">{t.device}</p><p className="mt-1 text-[9px] font-bold">{deviceName(payload) || "—"}</p></div>
            <div className="mt-4"><p className="text-[6px] font-bold uppercase tracking-widest text-[#b88721]">{t.assessment}</p><p className="mt-1 line-clamp-4 text-[7px] leading-3">{payload.damageAssessment || "—"}</p></div>
            <div className="mt-4 overflow-hidden border border-[#ddd5c5]"><div className="grid grid-cols-[1fr_45px_70px] bg-[#b88721] px-2 py-1.5 text-[6px] font-bold text-white"><span>{t.description}</span><span className="text-center">{t.qty}</span><span className="text-right">NET</span></div>{payload.items.length ? payload.items.slice(0, 7).map((item, index) => <div key={item.id} className="grid grid-cols-[1fr_45px_70px] border-t border-[#e5dfd2] px-2 py-1.5 text-[6.5px]"><span className="truncate">{item.description || "—"}</span><span className="text-center">{item.quantity}</span><span className="text-right font-bold">{euro(totals.lines[index]?.netCents || 0, locale)}</span></div>) : <p className="p-3 text-center text-[7px] text-[#888]">{t.noItems}</p>}</div>
            <div className="ml-auto mt-3 w-[58%] text-[7px]"><div className="flex justify-between py-1"><span>{t.net}</span><b>{euro(totals.netCents, locale)}</b></div><div className="flex justify-between py-1"><span>{t.vat} ({payload.vatRateBps / 100}%)</span><b>{euro(totals.vatCents, locale)}</b></div><div className="mt-1 flex justify-between bg-[#b88721] px-2 py-2 text-[8px] text-white"><span>{t.gross}</span><b>{euro(totals.grossCents, locale)}</b></div></div>
            <div className="mt-5 rounded bg-[#f6f2e8] p-3 text-[6.5px] leading-3"><p className="font-bold uppercase tracking-widest text-[#b88721]">{t.payment}</p><p className="mt-1">{payload.bankName} · {payload.accountHolder || "—"}</p><p>IBAN {payload.iban}</p><p>BIC {payload.bic}</p></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
