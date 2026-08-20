"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminDictionary } from "@/lib/admin-i18n";
import type { ProductIntakeRun } from "@/lib/product-intake/types";
import type { ProductRevision } from "@/lib/product-intake/workspace-types";

export default function ProductLinkedIntakeCard({
  locale,
  productId,
  condition,
  isOwner,
}: {
  locale: "de" | "en";
  productId: string;
  condition: string;
  isOwner: boolean;
}) {
  const copy = adminDictionary[locale].productsWorkspace;
  const [runs, setRuns] = useState<ProductIntakeRun[]>([]);
  const [revisions, setRevisions] = useState<ProductRevision[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/admin/products/${productId}/intake`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || cancelled) return;
        setRuns(payload.runs ?? []);
        setRevisions(payload.revisions ?? []);
      });
    return () => { cancelled = true; };
  }, [productId]);

  const latest = runs[0] ?? null;
  const start = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/products/intake/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, condition, scopes: ["commerce"] }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || copy.startFailed);
      setRuns((current) => [payload.run, ...current]);
      setMessage(`${copy.started} ${payload.run.intakeCode}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.startFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto mb-4 w-full max-w-[1500px] rounded-2xl border border-gold/25 bg-gold/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{copy.intakeTab}</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{latest?.intakeCode ?? copy.noRun}</h2>
          <p className="mt-1 text-sm text-muted">{latest ? `${latest.status} · ${latest.mode}` : copy.wizardStaffHint}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => void start()} className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">{copy.aiUpdate}</button>
          <Link href={`/admin/products?view=intake`} prefetch={false} className="rounded-xl border border-border/60 px-4 py-2 text-sm font-semibold text-foreground">{copy.intakeTab}</Link>
        </div>
      </div>
      {message ? <p className="mt-3 text-sm text-foreground" role="status">{message}</p> : null}
      {revisions[0] ? (
        <p className="mt-3 text-xs text-muted">Revision #{revisions[0].revisionNumber} · {revisions[0].mode}{isOwner ? "" : ` · ${copy.ownerOnly}`}</p>
      ) : null}
    </section>
  );
}
