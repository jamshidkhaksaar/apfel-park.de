"use client";

import { useEffect, useRef, useMemo, useState, useTransition } from "react";

import RepairBrandMark from "@/components/RepairBrandMark";
import type { RepairCatalog, RepairCatalogBrand, RepairCatalogFamily, RepairCatalogModel, RepairCatalogPart, RepairFamilyType, RepairPartVariant } from "@/lib/repair-catalog";
import { saveRepairCatalog } from "@/app/admin/repairs/catalog-actions";

const inputClassName =
  "w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

const textareaClassName = `${inputClassName} min-h-24`;

const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

// ── Model image upload cell ─────────────────────────────────────────────────

function ModelImageCell({
  imageUrl,
  onUploaded,
  onRemove,
  isGerman,
}: {
  imageUrl?: string;
  onUploaded: (url: string) => void;
  onRemove: () => void;
  isGerman: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/repairs/image-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (imageUrl) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative h-14 w-14 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full rounded-xl border border-white/10 bg-white/5 object-contain p-1"
          />
          <button
            type="button"
            onClick={onRemove}
            title={isGerman ? "Bild entfernen" : "Remove image"}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-white shadow transition hover:bg-red-500"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[10px] text-muted/50 transition hover:text-gold"
        >
          {isGerman ? "Ändern" : "Change"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title={isGerman ? "Gerätebild hochladen" : "Upload device image"}
        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 bg-white/3 text-muted/40 transition hover:border-gold/40 hover:text-gold/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-[9px] leading-tight">{isGerman ? "Foto" : "Photo"}</span>
          </>
        )}
      </button>
      {error && <p className="max-w-[56px] text-center text-[9px] text-red-400">{error}</p>}
    </div>
  );
}

// ── Brand logo upload cell ───────────────────────────────────────────────────

function BrandLogoCell({
  logoUrl,
  brandName,
  onUploaded,
  onRemove,
  isGerman,
}: {
  logoUrl?: string;
  brandName: string;
  onUploaded: (url: string) => void;
  onRemove: () => void;
  isGerman: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/repairs/image-upload?type=brand", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {logoUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={brandName}
            className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 object-contain p-2"
          />
          <button
            type="button"
            onClick={onRemove}
            title={isGerman ? "Logo entfernen" : "Remove logo"}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-white shadow transition hover:bg-red-500"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-white/15 bg-white/3 text-muted/40 transition hover:border-gold/40 hover:text-gold/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-[9px] font-medium">{isGerman ? "Logo" : "Logo"}</span>
            </>
          )}
        </button>
      )}

      {logoUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-[10px] text-muted/50 transition hover:text-gold disabled:opacity-50"
        >
          {isGerman ? "Ändern" : "Change"}
        </button>
      )}

      {error && <p className="max-w-[72px] text-center text-[9px] text-red-400">{error}</p>}
    </div>
  );
}

// ── Parts editor ─────────────────────────────────────────────────────────────

const makePartVariant = (): RepairPartVariant => ({
  id: makeId("variant"),
  label: "Standard",
  quality: "standard",
  price: null,
});

const qualityOptions: { value: RepairPartVariant["quality"]; de: string; en: string }[] = [
  { value: "genuine",  de: "Original (Genuine)", en: "Genuine (Original)" },
  { value: "premium",  de: "Premium",            en: "Premium" },
  { value: "standard", de: "Standard",           en: "Standard" },
];

// ── Shared SVG helpers ────────────────────────────────────────────────────────

function IconX({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Empty column placeholder ──────────────────────────────────────────────────

function EmptyColumnPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-10 text-center">
      <p className="text-sm text-muted/40">{text}</p>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  label,
  isGerman,
  onConfirm,
  onCancel,
}: {
  label: string;
  isGerman: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel mx-4 max-w-sm w-full rounded-2xl p-6 text-center">
        <svg className="mx-auto mb-3 h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted/60">
          {isGerman ? "Diese Aktion kann nicht rückgängig gemacht werden." : "This action cannot be undone."}
        </p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-full border border-border/60 py-2 text-sm text-muted transition hover:text-foreground">
            {isGerman ? "Abbrechen" : "Cancel"}
          </button>
          <button type="button" onClick={() => { onConfirm(); onCancel(); }}
            className="flex-1 rounded-full border border-red-500/50 bg-red-500/15 py-2 text-sm text-red-300 transition hover:bg-red-500/25">
            {isGerman ? "Löschen" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Save bar ──────────────────────────────────────────────────────────────────

function SaveBar({
  isPending,
  hasUnsavedChanges,
  message,
  isGerman,
  onSave,
}: {
  isPending: boolean;
  hasUnsavedChanges: boolean;
  message: { type: "success" | "error"; text: string } | null;
  isGerman: boolean;
  onSave: () => void;
}) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-border/60 bg-background/95 px-6 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        {hasUnsavedChanges && !message && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {isGerman ? "Ungespeicherte Änderungen" : "Unsaved changes"}
          </span>
        )}
        {message && (
          <span className={`text-xs truncate ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
            {message.text}
          </span>
        )}
      </div>
      <button type="button" onClick={onSave} disabled={isPending}
        className="btn-primary shrink-0 px-5 py-2 text-sm disabled:opacity-60">
        {isPending
          ? (isGerman ? "Speichert…" : "Saving…")
          : (isGerman ? "Katalog speichern" : "Save catalog")}
      </button>
    </div>
  );
}

// ── Breadcrumb bar ────────────────────────────────────────────────────────────

function BreadcrumbBar({
  brandName,
  familyName,
  modelName,
  isGerman,
}: {
  brandName: string | null;
  familyName: string | null;
  modelName: string | null;
  isGerman: boolean;
}) {
  const seg = (label: string | null, placeholder: string, gold?: boolean) => (
    <span className={label ? (gold ? "font-semibold text-gold" : "font-medium text-foreground") : "text-muted/30"}>
      {label ?? placeholder}
    </span>
  );
  return (
    <div className="flex items-center gap-2 border-b border-border/30 bg-background/50 px-6 py-2 text-xs">
      {seg(brandName, isGerman ? "Marke" : "Brand")}
      <span className="text-muted/25">→</span>
      {seg(familyName, isGerman ? "Kategorie" : "Category")}
      <span className="text-muted/25">→</span>
      {seg(modelName, isGerman ? "Gerät" : "Device", true)}
    </div>
  );
}

// ── Brand card ────────────────────────────────────────────────────────────────

function BrandCard({
  brand,
  isActive,
  isGerman,
  onSelect,
  onDelete,
  onUpdateName,
  onUpdateIcon,
  onRemoveIcon,
}: {
  brand: RepairCatalogBrand;
  isActive: boolean;
  isGerman: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateName: (name: string) => void;
  onUpdateIcon: (url: string) => void;
  onRemoveIcon: () => void;
}) {
  const totalModels = brand.families.reduce((sum, f) => sum + f.models.length, 0);
  const hasLogoUrl = brand.icon.startsWith("/") || brand.icon.startsWith("http");

  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-xl border px-3 py-3 transition-all duration-150 ${
        isActive
          ? "border-gold/50 bg-gold/8 ring-1 ring-gold/20"
          : "border-border/40 bg-white/3 hover:border-gold/25 hover:bg-white/5"
      }`}
    >
      {/* Top row */}
      <div className="flex items-center gap-3">
        <RepairBrandMark icon={brand.icon} name={brand.name} className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <input
            value={brand.name}
            onChange={(e) => { e.stopPropagation(); onUpdateName(e.target.value); }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none focus:underline focus:decoration-gold/40"
            placeholder={isGerman ? "Markenname" : "Brand name"}
          />
          <p className="text-[10px] text-muted/50">
            {totalModels} {isGerman ? "Modelle" : "models"}
          </p>
        </div>
        {/* Delete — hover only */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title={isGerman ? "Marke löschen" : "Delete brand"}
          className="invisible flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 group-hover:visible"
        >
          <IconX />
        </button>
      </div>

      {/* Logo upload — only when active */}
      {isActive && (
        <div className="mt-3 flex items-center gap-3 border-t border-white/8 pt-3" onClick={(e) => e.stopPropagation()}>
          <BrandLogoCell
            logoUrl={hasLogoUrl ? brand.icon : undefined}
            brandName={brand.name}
            isGerman={isGerman}
            onUploaded={onUpdateIcon}
            onRemove={onRemoveIcon}
          />
          <p className="text-[10px] leading-relaxed text-muted/40">
            {isGerman ? "Logo hochladen\n(PNG, SVG, WebP)" : "Upload logo\n(PNG, SVG, WebP)"}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Brands column ─────────────────────────────────────────────────────────────

function BrandsColumn({
  brands,
  selectedBrandId,
  isGerman,
  onSelectBrand,
  onAddBrand,
  onDeleteBrand,
  onUpdateBrand,
}: {
  brands: RepairCatalogBrand[];
  selectedBrandId: string;
  isGerman: boolean;
  onSelectBrand: (id: string) => void;
  onAddBrand: () => void;
  onDeleteBrand: (id: string) => void;
  onUpdateBrand: (id: string, updater: (b: RepairCatalogBrand) => RepairCatalogBrand) => void;
}) {
  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {isGerman ? "Marken" : "Brands"}
        </p>
        <button type="button" onClick={onAddBrand}
          className="rounded-lg border border-gold/40 bg-gold/8 px-2 py-1 text-[11px] font-semibold text-gold transition hover:bg-gold/15">
          + {isGerman ? "Marke" : "Brand"}
        </button>
      </div>

      {/* Brand list */}
      <div className="flex flex-col gap-1.5 p-3">
        {brands.length === 0 && (
          <p className="py-4 text-center text-xs text-muted/40">
            {isGerman ? "Noch keine Marken." : "No brands yet."}
          </p>
        )}
        {brands.map((brand) => (
          <BrandCard
            key={brand.id}
            brand={brand}
            isActive={brand.id === selectedBrandId}
            isGerman={isGerman}
            onSelect={() => onSelectBrand(brand.id)}
            onDelete={() => onDeleteBrand(brand.id)}
            onUpdateName={(name) => onUpdateBrand(brand.id, (b) => ({ ...b, name }))}
            onUpdateIcon={(icon) => onUpdateBrand(brand.id, (b) => ({ ...b, icon }))}
            onRemoveIcon={() => onUpdateBrand(brand.id, (b) => ({ ...b, icon: brand.id }))}
          />
        ))}
      </div>
    </div>
  );
}

// ── Device card ───────────────────────────────────────────────────────────────

function DeviceCard({
  model,
  familyId,
  isActive,
  onSelect,
  onDelete,
}: {
  model: RepairCatalogModel;
  familyId: string;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const partCount = model.parts?.length ?? 0;
  const deviceType = familyId.toLowerCase();
  const isTablet = deviceType.includes("ipad") || deviceType.includes("-tab");

  return (
    <div
      onClick={onSelect}
      className={`group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-150 ${
        isActive
          ? "border-gold/50 bg-gold/8 ring-1 ring-gold/25"
          : "border-border/40 bg-white/3 hover:border-gold/25 hover:bg-white/5"
      }`}
    >
      {/* Image or placeholder */}
      <div className="relative flex h-14 w-14 items-center justify-center">
        {model.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={model.image} alt={model.name} className="h-full w-full object-contain" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border/40 text-muted/20 ${isTablet ? "w-16" : ""}`}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          </div>
        )}
        {/* Part count badge */}
        {partCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-black">
            {partCount}
          </span>
        )}
        {/* Delete — hover only */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="invisible absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/90 text-white transition hover:bg-red-500 group-hover:visible"
        >
          <IconX className="h-2.5 w-2.5" />
        </button>
      </div>
      <p className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-foreground">
        {model.name}
      </p>
    </div>
  );
}

// ── Devices column ────────────────────────────────────────────────────────────

function DevicesColumn({
  brand,
  selectedFamilyId,
  selectedModelId,
  isGerman,
  onSelectFamily,
  onAddFamily,
  onAddModel,
  onDeleteModel,
  onSelectModel,
  onUpdateModel,
  onUpdateFamily,
}: {
  brand: RepairCatalogBrand | null;
  selectedFamilyId: string | null;
  selectedModelId: string | null;
  isGerman: boolean;
  onSelectFamily: (id: string) => void;
  onAddFamily: () => void;
  onAddModel: () => void;
  onDeleteModel: (id: string) => void;
  onSelectModel: (id: string) => void;
  onUpdateModel: (modelId: string, updater: (m: RepairCatalogModel) => RepairCatalogModel) => void;
  onUpdateFamily: (familyId: string, updater: (f: RepairCatalogFamily) => RepairCatalogFamily) => void;
}) {
  if (!brand) return <EmptyColumnPlaceholder text={isGerman ? "Marke auswählen" : "Select a brand"} />;

  const activeFamily = brand.families.find((f) => f.id === selectedFamilyId) ?? brand.families[0] ?? null;
  const selectedModel = activeFamily?.models.find((m) => m.id === selectedModelId) ?? null;

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Family tabs */}
      <div className="border-b border-border/40">
        <div className="flex overflow-x-auto px-3 pt-3">
          {brand.families.map((fam) => {
            const isActive = fam.id === (activeFamily?.id ?? "");
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => onSelectFamily(fam.id)}
                className={`shrink-0 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "border-gold/40 bg-gold/8 text-gold"
                    : "border-transparent text-muted/60 hover:text-foreground"
                }`}
              >
                {fam.name}
                <span className="ml-1 opacity-50">{fam.models.length}</span>
              </button>
            );
          })}
          <button type="button" onClick={onAddFamily}
            className="shrink-0 px-2 py-1.5 text-xs text-muted/40 transition hover:text-gold">
            + {isGerman ? "Kategorie" : "Category"}
          </button>
        </div>
      </div>

      {/* Family name / type edit row */}
      {activeFamily && (
        <div className="flex items-center gap-2 border-b border-border/25 px-3 py-2">
          <input
            value={activeFamily.name}
            onChange={(e) => onUpdateFamily(activeFamily.id, (f) => ({ ...f, name: e.target.value }))}
            className="flex-1 bg-transparent text-xs font-medium text-foreground outline-none focus:underline focus:decoration-gold/40"
            placeholder={isGerman ? "Kategoriename" : "Category name"}
          />
          <select
            value={activeFamily.type ?? "phone"}
            onChange={(e) => onUpdateFamily(activeFamily.id, (f) => ({ ...f, type: e.target.value as RepairFamilyType }))}
            className="shrink-0 rounded-lg border border-border/50 bg-background/70 px-1.5 py-1 text-[11px] text-muted/80 focus:border-gold/50 focus:outline-none"
            aria-label={isGerman ? "Gerätetyp" : "Device type"}
          >
            <option value="phone">{isGerman ? "📱 Smartphone" : "📱 Phone"}</option>
            <option value="tablet">🪬 Tablet</option>
            <option value="watch">{isGerman ? "⌚ Smartwatch" : "⌚ Watch"}</option>
            <option value="laptop">💻 Laptop</option>
            <option value="pc">{isGerman ? "🖥️ Desktop PC" : "🖥️ Desktop PC"}</option>
            <option value="other">{isGerman ? "🔧 Sonstige" : "🔧 Other"}</option>
          </select>
        </div>
      )}

      {!activeFamily ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-xs text-muted/40">{isGerman ? "Noch keine Kategorie." : "No category yet."}</p>
          <button type="button" onClick={onAddFamily} className="btn-secondary text-xs">
            + {isGerman ? "Kategorie erstellen" : "Create category"}
          </button>
        </div>
      ) : (
        <>
          {/* Device grid */}
          <div className="grid grid-cols-2 gap-2 p-3">
            {activeFamily.models.map((model) => (
              <DeviceCard
                key={model.id}
                model={model}
                familyId={activeFamily.id}
                isActive={model.id === selectedModelId}
                onSelect={() => onSelectModel(model.id)}
                onDelete={() => onDeleteModel(model.id)}
              />
            ))}
            {/* Add device card */}
            <button
              type="button"
              onClick={onAddModel}
              className="flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/50 text-muted/40 transition hover:border-gold/40 hover:bg-gold/5 hover:text-gold/60"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[11px] font-medium">{isGerman ? "Gerät" : "Device"}</span>
            </button>
          </div>

          {/* Inline model editor */}
          {selectedModel && (
            <div className="border-t border-border/40 p-4 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                {isGerman ? "Gerät bearbeiten" : "Edit device"}
              </p>
              <input
                value={selectedModel.name}
                onChange={(e) => onUpdateModel(selectedModel.id, (m) => ({ ...m, name: e.target.value }))}
                className={inputClassName}
                placeholder={isGerman ? "Gerätename" : "Device name"}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={typeof selectedModel.price === "number" ? selectedModel.price : ""}
                  onChange={(e) => onUpdateModel(selectedModel.id, (m) => ({
                    ...m,
                    price: e.target.value.trim() ? Number(e.target.value.replace(",", ".")) : null,
                  }))}
                  className={inputClassName}
                  placeholder={isGerman ? "Startpreis €" : "From price €"}
                />
                <input
                  value={selectedModel.note ?? ""}
                  onChange={(e) => onUpdateModel(selectedModel.id, (m) => ({ ...m, note: e.target.value }))}
                  className={inputClassName}
                  placeholder={isGerman ? "Notiz" : "Note"}
                />
              </div>
              <input
                value={selectedModel.sourceUrl ?? ""}
                onChange={(e) => onUpdateModel(selectedModel.id, (m) => ({ ...m, sourceUrl: e.target.value }))}
                className={inputClassName}
                placeholder="Source URL (optional)"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={selectedModel.launchYear ?? ""}
                  onChange={(e) => onUpdateModel(selectedModel.id, (m) => ({
                    ...m,
                    launchYear: e.target.value.trim() ? parseInt(e.target.value, 10) : undefined,
                  }))}
                  className={inputClassName}
                  placeholder={isGerman ? "Baujahr" : "Launch year"}
                  min={1990} max={2099}
                />
                <input
                  value={(selectedModel.colors ?? []).join(", ")}
                  onChange={(e) => onUpdateModel(selectedModel.id, (m) => ({
                    ...m,
                    colors: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                  }))}
                  className={inputClassName}
                  placeholder={isGerman ? "Farben (kommagetrennt)" : "Colors (comma-sep.)"}
                />
                <input
                  value={(selectedModel.modelNumbers ?? []).join(", ")}
                  onChange={(e) => onUpdateModel(selectedModel.id, (m) => ({
                    ...m,
                    modelNumbers: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                  }))}
                  className={inputClassName}
                  placeholder={isGerman ? "Modell-Nr." : "Model no."}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Variant row ───────────────────────────────────────────────────────────────

const qualityBadgeClass: Record<string, string> = {
  genuine: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  premium: "border-slate-400/40 bg-slate-400/10 text-slate-300",
  standard: "border-border/50 bg-white/5 text-muted",
};

function VariantRow({
  variant,
  isGerman,
  onUpdate,
  onDelete,
}: {
  variant: RepairPartVariant;
  isGerman: boolean;
  onUpdate: (v: RepairPartVariant) => void;
  onDelete: () => void;
}) {
  const badgeCls = qualityBadgeClass[variant.quality] ?? qualityBadgeClass.standard;
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={variant.quality}
        onChange={(e) => onUpdate({ ...variant, quality: e.target.value as RepairPartVariant["quality"] })}
        className={`w-28 shrink-0 rounded-lg border px-2 py-1.5 text-[11px] font-semibold outline-none focus:ring-1 focus:ring-gold/30 ${badgeCls} bg-background/70`}
      >
        {qualityOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-background text-foreground">
            {isGerman ? opt.de : opt.en}
          </option>
        ))}
      </select>
      <input
        value={variant.label}
        onChange={(e) => onUpdate({ ...variant, label: e.target.value })}
        className="min-w-0 flex-1 rounded-lg border border-border/70 bg-background/70 px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40"
        placeholder={isGerman ? "Bezeichnung" : "Label"}
      />
      <input
        type="number"
        value={typeof variant.price === "number" ? variant.price : ""}
        onChange={(e) => onUpdate({ ...variant, price: e.target.value.trim() ? Number(e.target.value) : null })}
        className="w-20 shrink-0 rounded-lg border border-border/70 bg-background/70 px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40"
        placeholder="€"
      />
      <button type="button" onClick={onDelete}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300 transition hover:bg-red-500/20">
        <IconX className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ── Part row ──────────────────────────────────────────────────────────────────

function PartRow({
  part,
  isGerman,
  onUpdatePart,
  onDeletePart,
  onAddVariant,
  onDeleteVariant,
  onUpdateVariant,
}: {
  part: RepairCatalogPart;
  isGerman: boolean;
  onUpdatePart: (updated: RepairCatalogPart) => void;
  onDeletePart: () => void;
  onAddVariant: () => void;
  onDeleteVariant: (variantId: string) => void;
  onUpdateVariant: (variantId: string, updated: RepairPartVariant) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-3">
      {/* Part header */}
      <div className="flex items-center gap-2">
        <input
          value={part.name}
          onChange={(e) => onUpdatePart({ ...part, name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none focus:underline focus:decoration-gold/40"
          placeholder={isGerman ? "Teilname (z.B. Display)" : "Part name (e.g. Display)"}
        />
        <button type="button" onClick={onDeletePart}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300 transition hover:bg-red-500/20">
          <IconX />
        </button>
      </div>

      {/* Variant rows */}
      <div className="mt-2.5 space-y-1.5">
        {part.variants.map((v) => (
          <VariantRow
            key={v.id}
            variant={v}
            isGerman={isGerman}
            onUpdate={(updated) => onUpdateVariant(v.id, updated)}
            onDelete={() => onDeleteVariant(v.id)}
          />
        ))}
      </div>

      <button type="button" onClick={onAddVariant}
        className="mt-2 text-[11px] text-gold/60 transition hover:text-gold">
        + {isGerman ? "Variante" : "Variant"}
      </button>
    </div>
  );
}

// ── Quick add bar ─────────────────────────────────────────────────────────────

function QuickAddBar({ isGerman, onAddPart }: { isGerman: boolean; onAddPart: (name: string) => void }) {
  const [custom, setCustom] = useState("");
  const quickNames = isGerman
    ? ["Display", "Akku", "Rückglas", "Kamera", "Ladeport", "Lautsprecher"]
    : ["Display", "Battery", "Back Cover", "Camera", "Charging Port", "Speaker"];

  const submit = () => {
    const trimmed = custom.trim();
    if (trimmed) { onAddPart(trimmed); setCustom(""); }
  };

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted/60">
        {isGerman ? "Schnell hinzufügen" : "Quick add"}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {quickNames.map((name) => (
          <button key={name} type="button" onClick={() => onAddPart(name)}
            className="rounded-full border border-gold/30 bg-gold/8 px-2.5 py-1 text-[11px] text-gold/80 transition hover:bg-gold/15 hover:text-gold">
            + {name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          className="flex-1 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-foreground outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40"
          placeholder={isGerman ? "Eigenes Teil…" : "Custom part…"}
        />
        <button type="button" onClick={submit} disabled={!custom.trim()}
          className="btn-secondary px-3 py-2 text-xs disabled:opacity-30">
          {isGerman ? "Hinzufügen" : "Add"}
        </button>
      </div>
    </div>
  );
}

// ── Parts column ──────────────────────────────────────────────────────────────

function PartsColumn({
  brand,
  family,
  model,
  isGerman,
  onUpdateModel,
}: {
  brand: RepairCatalogBrand | null;
  family: RepairCatalogFamily | null;
  model: RepairCatalogModel | null;
  isGerman: boolean;
  onUpdateModel: (modelId: string, updater: (m: RepairCatalogModel) => RepairCatalogModel) => void;
}) {
  if (!model || !family || !brand) {
    return (
      <EmptyColumnPlaceholder
        text={isGerman ? "Gerät auswählen, um Teile zu bearbeiten" : "Select a device to edit parts & pricing"}
      />
    );
  }

  const parts = model.parts ?? [];

  const updatePart = (partId: string, updater: (p: RepairCatalogPart) => RepairCatalogPart) => {
    onUpdateModel(model.id, (m) => ({
      ...m,
      parts: (m.parts ?? []).map((p) => (p.id === partId ? updater(p) : p)),
    }));
  };

  const addPart = (name: string) => {
    onUpdateModel(model.id, (m) => ({
      ...m,
      parts: [...(m.parts ?? []), { id: makeId("part"), name, variants: [makePartVariant()] }],
    }));
  };

  const deletePart = (partId: string) => {
    onUpdateModel(model.id, (m) => ({
      ...m,
      parts: (m.parts ?? []).filter((p) => p.id !== partId),
    }));
  };

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border/40 px-5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {isGerman ? "Teile & Preise" : "Parts & Pricing"}
        </p>
        <h3 className="mt-0.5 truncate text-sm font-semibold text-foreground">{model.name}</h3>
      </div>

      {/* Image upload row */}
      <div className="flex items-center gap-3 border-b border-border/25 px-5 py-3">
        <ModelImageCell
          imageUrl={model.image}
          isGerman={isGerman}
          onUploaded={(url) => onUpdateModel(model.id, (m) => ({ ...m, image: url }))}
          onRemove={() => onUpdateModel(model.id, (m) => { const n = { ...m }; delete n.image; return n; })}
        />
        <div>
          <p className="text-[11px] font-medium text-muted/70">
            {isGerman ? "Gerätebild" : "Device image"}
          </p>
          <p className="text-[10px] text-muted/40">PNG, JPG, WebP</p>
        </div>
      </div>

      {/* Parts list */}
      <div className="flex-1 p-4">
        {parts.length === 0 && (
          <p className="py-4 text-center text-xs text-muted/40">
            {isGerman ? "Noch keine Teile. Unten hinzufügen." : "No parts yet. Use quick add below."}
          </p>
        )}

        <div className="space-y-2.5">
          {parts.map((part) => (
            <PartRow
              key={part.id}
              part={part}
              isGerman={isGerman}
              onUpdatePart={(updated) => updatePart(part.id, () => updated)}
              onDeletePart={() => deletePart(part.id)}
              onAddVariant={() => updatePart(part.id, (p) => ({ ...p, variants: [...p.variants, makePartVariant()] }))}
              onDeleteVariant={(vid) => updatePart(part.id, (p) => ({ ...p, variants: p.variants.filter((v) => v.id !== vid) }))}
              onUpdateVariant={(vid, updated) => updatePart(part.id, (p) => ({ ...p, variants: p.variants.map((v) => v.id === vid ? updated : v) }))}
            />
          ))}
        </div>

        <QuickAddBar isGerman={isGerman} onAddPart={addPart} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  locale: "de" | "en";
  initialCatalog: RepairCatalog;
};

export default function AdminRepairCatalogManager({ locale, initialCatalog }: Props) {
  const isGerman = locale === "de";

  // ── Core data ──
  const [catalog, setCatalog] = useState<RepairCatalog>(initialCatalog);
  const catalogRef = useRef(catalog);
  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  // ── Navigation ──
  const [selectedBrandId, setSelectedBrandId] = useState(initialCatalog.brands[0]?.id ?? "");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // ── UI ──
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ label: string; onConfirm: () => void } | null>(null);

  // ── Derived ──
  const selectedBrand = useMemo(
    () => catalog.brands.find((b) => b.id === selectedBrandId) ?? null,
    [catalog.brands, selectedBrandId],
  );
  const activeFamilies = useMemo(() => selectedBrand?.families ?? [], [selectedBrand]);
  const activeFamily = useMemo(
    () => activeFamilies.find((f) => f.id === selectedFamilyId) ?? activeFamilies[0] ?? null,
    [activeFamilies, selectedFamilyId],
  );
  const selectedModel = useMemo(
    () => activeFamily?.models.find((m) => m.id === selectedModelId) ?? null,
    [activeFamily, selectedModelId],
  );

  // ── Catalog mutators ──
  const updateCatalog = (updater: (c: RepairCatalog) => RepairCatalog) => {
    setCatalog(updater);
    setHasUnsavedChanges(true);
  };

  const updateBrand = (brandId: string, updater: (b: RepairCatalogBrand) => RepairCatalogBrand) => {
    updateCatalog((c) => ({ brands: c.brands.map((b) => b.id === brandId ? updater(b) : b) }));
  };

  const updateFamily = (brandId: string, familyId: string, updater: (f: RepairCatalogFamily) => RepairCatalogFamily) => {
    updateBrand(brandId, (b) => ({ ...b, families: b.families.map((f) => f.id === familyId ? updater(f) : f) }));
  };

  const updateModelInFamily = (brandId: string, familyId: string, modelId: string, updater: (m: RepairCatalogModel) => RepairCatalogModel) => {
    updateFamily(brandId, familyId, (f) => ({ ...f, models: f.models.map((m) => m.id === modelId ? updater(m) : m) }));
  };

  // ── Confirm helper ──
  const requestConfirm = (label: string, onConfirm: () => void) => setConfirmAction({ label, onConfirm });

  // ── Brand actions ──
  const handleAddBrand = () => {
    const newBrand: RepairCatalogBrand = {
      id: makeId("brand"),
      name: isGerman ? "Neue Marke" : "New brand",
      icon: "",
      description: "",
      sourceUrl: "",
      families: [],
    };
    updateCatalog((c) => ({ brands: [...c.brands, newBrand] }));
    setSelectedBrandId(newBrand.id);
    setSelectedFamilyId(null);
    setSelectedModelId(null);
  };

  const handleDeleteBrand = (brandId: string) => {
    requestConfirm(
      isGerman ? "Marke wirklich löschen?" : "Delete this brand?",
      () => {
        updateCatalog((c) => {
          const next = c.brands.filter((b) => b.id !== brandId);
          if (selectedBrandId === brandId) {
            setSelectedBrandId(next[0]?.id ?? "");
            setSelectedFamilyId(null);
            setSelectedModelId(null);
          }
          return { brands: next };
        });
      },
    );
  };

  // ── Family actions ──
  const handleAddFamily = () => {
    if (!selectedBrand) return;
    const newFamily: RepairCatalogFamily = {
      id: makeId("family"),
      name: isGerman ? "Neue Kategorie" : "New category",
      description: "",
      sourceUrl: "",
      models: [],
    };
    updateBrand(selectedBrand.id, (b) => ({ ...b, families: [...b.families, newFamily] }));
    setSelectedFamilyId(newFamily.id);
    setSelectedModelId(null);
  };

  // ── Model actions ──
  const handleAddModel = () => {
    if (!selectedBrand || !activeFamily) return;
    const defaultPartNames = isGerman
      ? ["Display", "Akku", "Rückglas", "Kamera"]
      : ["Display", "Battery", "Back Cover", "Camera"];
    const defaultParts: RepairCatalogPart[] = defaultPartNames.map((name) => ({
      id: makeId("part"),
      name,
      variants: [{ id: makeId("variant"), label: isGerman ? "Standard" : "Standard", quality: "standard" as const, price: null }],
    }));
    const newModel: RepairCatalogModel = {
      id: makeId("model"),
      name: isGerman ? "Neues Gerät" : "New device",
      price: null,
      note: "",
      sourceUrl: "",
      parts: defaultParts,
    };
    updateFamily(selectedBrand.id, activeFamily.id, (f) => ({ ...f, models: [...f.models, newModel] }));
    setSelectedModelId(newModel.id);
  };

  const handleDeleteModel = (modelId: string) => {
    if (!selectedBrand || !activeFamily) return;
    requestConfirm(
      isGerman ? "Gerät wirklich löschen?" : "Delete this device?",
      () => {
        updateFamily(selectedBrand.id, activeFamily.id, (f) => ({
          ...f,
          models: f.models.filter((m) => m.id !== modelId),
        }));
        if (selectedModelId === modelId) setSelectedModelId(null);
      },
    );
  };

  // ── Save ──
  const handleSave = () => {
    setMessage(null);
    const snapshot = catalogRef.current;
    startTransition(async () => {
      const result = await saveRepairCatalog(snapshot, locale);
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) {
        setHasUnsavedChanges(false);
        setTimeout(() => setMessage(null), 4000);
      }
    });
  };

  return (
    <div className="flex flex-col">
      <SaveBar
        isPending={isPending}
        hasUnsavedChanges={hasUnsavedChanges}
        message={message}
        isGerman={isGerman}
        onSave={handleSave}
      />

      <BreadcrumbBar
        brandName={selectedBrand?.name ?? null}
        familyName={activeFamily?.name ?? null}
        modelName={selectedModel?.name ?? null}
        isGerman={isGerman}
      />

      {/* Three-column layout */}
      <div className="grid min-h-[calc(100vh-160px)] grid-cols-1 divide-y divide-border/40 overflow-hidden xl:grid-cols-[260px_300px_minmax(0,1fr)] xl:divide-x xl:divide-y-0">
        <BrandsColumn
          brands={catalog.brands}
          selectedBrandId={selectedBrandId}
          isGerman={isGerman}
          onSelectBrand={(id) => { setSelectedBrandId(id); setSelectedFamilyId(null); setSelectedModelId(null); }}
          onAddBrand={handleAddBrand}
          onDeleteBrand={handleDeleteBrand}
          onUpdateBrand={updateBrand}
        />

        <DevicesColumn
          brand={selectedBrand}
          selectedFamilyId={activeFamily?.id ?? null}
          selectedModelId={selectedModelId}
          isGerman={isGerman}
          onSelectFamily={(id) => { setSelectedFamilyId(id); setSelectedModelId(null); }}
          onAddFamily={handleAddFamily}
          onAddModel={handleAddModel}
          onDeleteModel={handleDeleteModel}
          onSelectModel={(id) => setSelectedModelId((prev) => (prev === id ? null : id))}
          onUpdateModel={(modelId, updater) => {
            if (!selectedBrand || !activeFamily) return;
            updateModelInFamily(selectedBrand.id, activeFamily.id, modelId, updater);
          }}
          onUpdateFamily={(familyId, updater) => {
            if (!selectedBrand) return;
            updateFamily(selectedBrand.id, familyId, updater);
          }}
        />

        <PartsColumn
          brand={selectedBrand}
          family={activeFamily}
          model={selectedModel}
          isGerman={isGerman}
          onUpdateModel={(modelId, updater) => {
            if (!selectedBrand || !activeFamily) return;
            updateModelInFamily(selectedBrand.id, activeFamily.id, modelId, updater);
          }}
        />
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmDialog
          label={confirmAction.label}
          isGerman={isGerman}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

// Kept for TS — suppress unused warning on textareaClassName
void textareaClassName;
