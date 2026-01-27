"use client";

import Image from "next/image";
import { useState, useRef } from "react";

import AdminShell from "../../../components/admin/AdminShell";

type BrandingAsset = {
  name: string;
  label: string;
  description: string;
  currentSrc: string;
  accept: string;
  dimensions: string;
};

const brandingAssets: BrandingAsset[] = [
  {
    name: "logo",
    label: "Logo (Dark Theme)",
    description: "Hauptlogo für den dunklen Theme. Wird auf allen Seiten angezeigt.",
    currentSrc: "/branding/logo.jpg",
    accept: "image/png,image/jpeg,image/svg+xml,image/webp",
    dimensions: "Empfohlen: 512x512px oder quadratisch",
  },
  {
    name: "logo-white",
    label: "Logo (Ocean Theme)",
    description: "Weißes Logo für den blauen Ocean-Theme. Sollte weiß/hell sein für gute Sichtbarkeit.",
    currentSrc: "/branding/logo-white.png",
    accept: "image/png,image/svg+xml,image/webp",
    dimensions: "Empfohlen: 512x512px, PNG mit Transparenz",
  },
  {
    name: "favicon",
    label: "Favicon",
    description: "Browser-Tab Icon. Wird als ICO oder PNG hochgeladen.",
    currentSrc: "/favicon.ico",
    accept: "image/x-icon,image/png,image/svg+xml",
    dimensions: "Empfohlen: 32x32px oder 64x64px",
  },
  {
    name: "og-image",
    label: "Social Preview (OG Image)",
    description: "Vorschaubild für Social Media Links (Facebook, LinkedIn, Twitter).",
    currentSrc: "/branding/og-image.png",
    accept: "image/png,image/jpeg,image/webp",
    dimensions: "Empfohlen: 1200x630px",
  },
];

export default function BrandingPage() {
  const [uploads, setUploads] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (assetName: string, file: File | null) => {
    if (file) {
      setUploads((prev) => ({ ...prev, [assetName]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [assetName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (assetName: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(assetName, file);
    }
  };

  const handleSave = async () => {
    const filesToUpload = Object.entries(uploads).filter(([, file]) => file !== null);
    if (filesToUpload.length === 0) {
      setMessage({ type: "error", text: "Keine Dateien zum Hochladen ausgewahlt." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      for (const [name, file] of filesToUpload) {
        if (file) {
          formData.append(name, file);
        }
      }

      const response = await fetch("/api/branding", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Branding erfolgreich aktualisiert!" });
        setUploads({});
        // Force reload to show new images
        window.location.reload();
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Fehler beim Speichern." });
      }
    } catch {
      setMessage({ type: "error", text: "Netzwerkfehler. Bitte erneut versuchen." });
    } finally {
      setSaving(false);
    }
  };

  const clearUpload = (assetName: string) => {
    setUploads((prev) => {
      const newUploads = { ...prev };
      delete newUploads[assetName];
      return newUploads;
    });
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[assetName];
      return newPreviews;
    });
    if (fileInputRefs.current[assetName]) {
      fileInputRefs.current[assetName]!.value = "";
    }
  };

  const hasChanges = Object.keys(uploads).length > 0;

  return (
    <AdminShell title="Branding">
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="glass-panel flex items-start gap-4 rounded-2xl border-blue-500/20 bg-blue-950/10 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-400">Branding Assets</h3>
            <p className="mt-1 text-sm text-blue-400/80">
              Lade dein Logo, Favicon und Social Media Vorschaubild hoch. Die Dateien werden im
              public-Ordner gespeichert und sofort auf der Website angezeigt.
            </p>
          </div>
        </div>

        {/* Branding Assets Grid */}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {brandingAssets.map((asset) => (
            <div key={asset.name} className="glass-panel rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{asset.label}</h3>
                  <p className="mt-1 text-sm text-muted">{asset.description}</p>
                </div>
              </div>

              {/* Current/Preview Image */}
              <div
                className="relative mt-4 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/60 bg-black/20 transition hover:border-brand-gold/50"
                onClick={() => fileInputRefs.current[asset.name]?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(asset.name, e)}
              >
                {previews[asset.name] ? (
                  <Image
                    src={previews[asset.name]}
                    alt={`${asset.label} preview`}
                    fill
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="relative h-full w-full">
                    <Image
                      src={asset.currentSrc}
                      alt={asset.label}
                      fill
                      className="object-contain p-4 opacity-60"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <svg
                        className="h-10 w-10 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>
                      <p className="mt-2 text-xs text-muted">Klicken oder Datei hierher ziehen</p>
                    </div>
                  </div>
                )}

                {/* New badge if file selected */}
                {uploads[asset.name] && (
                  <div className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">
                    Neu
                  </div>
                )}
              </div>

              {/* File Info & Actions */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted">{asset.dimensions}</p>

                {uploads[asset.name] && (
                  <div className="flex items-center justify-between rounded-lg bg-green-500/10 px-3 py-2">
                    <span className="truncate text-xs text-green-400">
                      {uploads[asset.name]?.name}
                    </span>
                    <button
                      onClick={() => clearUpload(asset.name)}
                      className="ml-2 text-green-400 hover:text-green-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                <input
                  ref={(el) => { fileInputRefs.current[asset.name] = el; }}
                  type="file"
                  accept={asset.accept}
                  onChange={(e) => handleFileSelect(asset.name, e.target.files?.[0] || null)}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRefs.current[asset.name]?.click()}
                  className="w-full rounded-xl border border-border/60 bg-surface-strong/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-strong"
                >
                  Datei auswahlen
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button & Messages */}
        <div className="glass-panel flex items-center justify-between rounded-2xl p-6">
          <div>
            {message && (
              <p
                className={`text-sm font-medium ${
                  message.type === "success" ? "text-green-400" : "text-red-400"
                }`}
              >
                {message.text}
              </p>
            )}
            {!message && hasChanges && (
              <p className="text-sm text-muted">
                {Object.keys(uploads).length} Datei(en) zum Hochladen bereit
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
              hasChanges && !saving
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
                : "cursor-not-allowed bg-surface-strong text-muted"
            }`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Speichern...
              </span>
            ) : (
              "Anderungen speichern"
            )}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
