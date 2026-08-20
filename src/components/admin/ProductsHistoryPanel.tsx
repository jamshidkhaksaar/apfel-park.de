"use client";

import { adminDictionary } from "@/lib/admin-i18n";
import type { ProductIntakeRun } from "@/lib/product-intake/types";
import type { ProductRevision } from "@/lib/product-intake/workspace-types";

const TERMINAL = new Set(["applied", "rejected", "cancelled", "failed"]);

export default function ProductsHistoryPanel({
  locale,
  runs,
  revisions,
  isOwner,
}: {
  locale: "de" | "en";
  runs: ProductIntakeRun[];
  revisions: ProductRevision[];
  isOwner: boolean;
}) {
  const copy = adminDictionary[locale].productsWorkspace;
  const history = runs.filter((run) => TERMINAL.has(run.status) || Boolean(run.staleAt));
  const restore = async (productId: string, revisionId: string) => {
    await fetch(`/api/admin/products/${productId}/revisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId }),
    });
  };
  if (history.length === 0 && revisions.length === 0) {
    return <p className="rounded-2xl border border-border/60 bg-surface/45 px-5 py-12 text-center text-sm text-muted">{copy.noHistory}</p>;
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-border/60 bg-surface/55 p-5">
        <h2 className="font-semibold text-foreground">{copy.historyTitle}</h2>
        <div className="mt-3 space-y-2">
          {history.map((run) => (
            <div key={run.id} className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
              <p className="font-semibold text-foreground">{run.intakeCode} · {run.status}</p>
              <p className="mt-1 text-xs text-muted">{run.originProductId ?? run.targetProductId ?? "—"} · {run.condition ?? "condition?"}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-border/60 bg-surface/55 p-5">
        <h2 className="font-semibold text-foreground">{copy.restore}</h2>
        <p className="mt-1 text-sm text-muted">{copy.restoreHint}</p>
        <div className="mt-3 space-y-2">
          {revisions.map((revision) => (
            <div key={revision.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">#{revision.revisionNumber} · {revision.mode}</p>
                <p className="mt-1 text-xs text-muted">{revision.changedPaths.join(", ") || "—"}</p>
              </div>
              <button
                type="button"
                disabled={!isOwner || !revision.productId}
                onClick={() => void restore(revision.productId, revision.id)}
                className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs font-semibold text-gold disabled:opacity-40"
              >
                {isOwner ? copy.restore : copy.ownerOnly}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
