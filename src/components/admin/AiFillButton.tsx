"use client";

import { useState } from "react";
import type { ProductResearchResult } from "@/lib/product-research";

export default function AiFillButton({
  locale,
  onResult,
  onError,
  query,
  disabled,
}: {
  locale: "de" | "en";
  onResult: (research: ProductResearchResult) => void;
  onError: (message: string) => void;
  query?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const isGerman = locale === "de";
  const run = async () => {
    if (busy) return;
    if (!query?.trim()) {
      onError(isGerman ? "Bitte zuerst einen Titel oder Modellnamen eingeben." : "Please enter a title or model name first.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/products/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        if (response.status === 504 || response.status === 502) {
          throw new Error(isGerman ? "Zeitüberschreitung der KI-Anfrage (Gateway Timeout). Bitte versuchen Sie es erneut." : "AI request timed out. Please try again.");
        }
        throw new Error(isGerman ? `Serverfehler (${response.status}). Bitte erneut versuchen.` : `Server error (${response.status}). Please try again.`);
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isGerman ? "KI-Forschung fehlgeschlagen" : "AI research failed"));
      onResult(payload.research as ProductResearchResult);
    } catch (error) {
      onError(error instanceof Error ? error.message : (isGerman ? "KI-Forschung fehlgeschlagen" : "AI research failed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={() => void run()}
      className="inline-flex items-center gap-2 rounded-xl bg-gold px-3 py-2 text-xs font-semibold text-black transition disabled:opacity-60"
    >
      {busy ? (
        <>
          <span className="relative flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-black/70" />
          </span>
          {isGerman ? "KI sucht & füllt…" : "AI searching & filling…"}
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M4.5 4.5L12 12l-7.5 7.5" />
          </svg>
          {isGerman ? "KI-Daten holen" : "Fetch AI data"}
        </>
      )}
    </button>
  );
}