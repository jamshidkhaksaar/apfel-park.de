"use client";

import { useState } from "react";

import { adminDictionary } from "@/lib/admin-i18n";
import type { ProductIntakeRun } from "@/lib/product-intake/types";
import { productIntakeScopes, type ProductIntakeScope } from "@/lib/product-intake/workspace-constants";

type CatalogOption = { id: string; title: string; condition: string | null; sku: string | null; isActive: boolean };

export default function ProductIntakeWizard({
  locale,
  products,
  isOwner,
}: {
  locale: "de" | "en";
  products: CatalogOption[];
  isOwner: boolean;
}) {
  const copy = adminDictionary[locale].productsWorkspace;
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const selected = products.find((item) => item.id === productId) ?? null;
  const [scopes, setScopes] = useState<ProductIntakeScope[]>(["commerce"]);
  const [price, setPrice] = useState("");
  const [inventoryMode, setInventoryMode] = useState<"add" | "set">("add");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [run, setRun] = useState<ProductIntakeRun | null>(null);
  const [evidenceKind, setEvidenceKind] = useState("barcode");
  const [file, setFile] = useState<File | null>(null);

  const toggleScope = (scope: ProductIntakeScope) => {
    setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  };

  const startRun = async () => {
    if (!productId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/products/intake/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          condition: selected?.condition,
          scopes: scopes.length ? scopes : ["commerce"],
          price: price ? Number(price) : null,
          inventoryMode: quantity ? inventoryMode : null,
          quantity: quantity ? Number(quantity) : null,
          notes: notes.trim() || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || copy.startFailed);
      setRun(payload.run);
      setMessage(`${copy.started} ${payload.run.intakeCode}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.startFailed);
    } finally {
      setBusy(false);
    }
  };

  const uploadEvidence = async () => {
    if (!run || !file) return;
    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("evidence", evidenceKind);
      const response = await fetch(`/api/admin/products/intake/runs/${run.id}/assets`, { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || copy.uploadFailed);
      setMessage(copy.uploaded);
      setFile(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.uploadFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-surface/55 p-5">
      <h2 className="text-lg font-semibold text-foreground">{copy.wizardTitle}</h2>
      <p className="mt-1 text-sm text-muted">{isOwner ? copy.wizardOwnerHint : copy.wizardStaffHint}</p>
      {message ? <p className="mt-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm" role="status">{message}</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-muted">
          {copy.pinProduct}
          <select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground">
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title} {product.isActive ? "" : locale === "de" ? "(Entwurf)" : "(draft)"}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm text-muted">
          <p>{copy.confirmedCondition}: <span className="font-semibold text-foreground">{selected?.condition ?? "new"}</span></p>
          <p className="mt-1">SKU: {selected?.sku || "—"}</p>
        </div>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-foreground">{copy.scopes}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {productIntakeScopes.map((scope) => (
            <label key={scope} className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-3 py-1.5 text-sm">
              <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
              {scope}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder={copy.pricePlaceholder} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
        <select value={inventoryMode} onChange={(event) => setInventoryMode(event.target.value as "add" | "set")} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
          <option value="add">{copy.addStock}</option>
          <option value="set">{copy.setStock}</option>
        </select>
        <input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder={copy.quantityPlaceholder} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
      </div>
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder={copy.notesPlaceholder} className="mt-3 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy || !productId} onClick={() => void startRun()} className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">{copy.startRun}</button>
      </div>
      {run ? (
        <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-sm font-semibold text-foreground">{run.intakeCode} · {run.status}</p>
          <p className="mt-1 text-xs text-muted">{copy.continueHint}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_auto]">
            <select value={evidenceKind} onChange={(event) => setEvidenceKind(event.target.value)} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
              <option value="barcode">{copy.barcodePhoto}</option>
              <option value="about">{copy.aboutScreenshot}</option>
              <option value="battery">{copy.batteryScreenshot}</option>
              <option value="shop">{copy.shopPhoto}</option>
            </select>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="text-sm" />
            <button type="button" disabled={busy || !file} onClick={() => void uploadEvidence()} className="rounded-xl border border-gold/40 px-4 py-2 text-sm font-semibold text-gold disabled:opacity-40">{copy.uploadEvidence}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
