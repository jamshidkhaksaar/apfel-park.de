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
    setBusy(true);
    try {
      const response = await fetch("/api/admin/products/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query ?? "" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || (isGerman ? "KI-Forschung fehlgeschlagen" : "AI research failed"));
      onResult(payload.research);
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
      className="inline-flex items-center gap-2 rounded-xl bg-gold px-3 py-2 text-xs font-semibold text-black disabled:opacity-40"
    >
      {busy ? (isGerman ? "Lädt…" : "Loading…") : (isGerman ? "KI-Daten holen" : "Fetch AI data")}
    </button>
  );
}
