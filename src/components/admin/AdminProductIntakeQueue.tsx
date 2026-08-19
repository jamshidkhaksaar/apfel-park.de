"use client";

import { useMemo, useState } from "react";

import type { ProductIntakeRun, ProductIntakeRunDetail as IntakeDetail } from "@/lib/product-intake/types";
import { adminDictionary } from "@/lib/admin-i18n";
import ProductIntakeRunDetail from "./ProductIntakeRunDetail";

const TERMINAL_STATUSES = new Set(["applied", "rejected", "cancelled"]);

export default function AdminProductIntakeQueue({
  locale,
  initialRuns,
  initialDetail,
  initialPreviewUrl,
}: {
  locale: "de" | "en";
  initialRuns: ProductIntakeRun[];
  initialDetail: IntakeDetail | null;
  initialPreviewUrl: string | null;
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [detail, setDetail] = useState(initialDetail);
  const [selectedId, setSelectedId] = useState(initialDetail?.run.id ?? "");
  const [status, setStatus] = useState("active");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  const copy = adminDictionary[locale].productIntakePage;
  const filtered = useMemo(
    () => runs.filter((run) => status === "all" || (status === "active" ? !TERMINAL_STATUSES.has(run.status) : run.status === status)),
    [runs, status],
  );

  const loadDetail = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setBusy(true);
    setMessage("");
    setPreviewUrl(null);
    try {
      const response = await fetch(`/api/integrations/product-intake/runs/${id}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || copy.loadFailed);
      setDetail({ run: payload.run, assets: payload.assets ?? [], events: payload.events ?? [] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.loadFailed);
    } finally {
      setBusy(false);
    }
  };

  const refreshRuns = async () => {
    const response = await fetch("/api/integrations/product-intake/runs?limit=200", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setRuns(payload.runs ?? []);
  };

  const decide = async (decision: "approve" | "reject" | "request_changes") => {
    if (!detail?.run.proposalHash) return;
    setBusy(true);
    setMessage("");
    try {
      const stage = decision === "approve"
        ? detail.run.proposal?.operation === "update"
          ? "update"
          : detail.run.approvalCount === 0
            ? "draft"
            : detail.run.mode === "live" && !detail.run.targetProductId
              ? "draft"
              : "publish"
        : null;
      const response = await fetch(`/api/integrations/product-intake/runs/${detail.run.id}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `admin:${decision}:${stage ?? "none"}:${detail.run.id}:${detail.run.proposalHash.slice(0, 16)}`,
        },
        body: JSON.stringify({ decision, stage, proposalHash: detail.run.proposalHash, reason: feedback.trim() || null }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || copy.decisionFailed);
      const nextPreviewUrl = payload.preview?.token ? `/store/preview/${payload.preview.token}` : null;
      setDetail((current) => current ? { ...current, run: payload.run } : current);
      setFeedback("");
      setMessage(payload.shadowMode
        ? copy.decisionShadow
        : copy.decisionLive);
      const refreshed = await Promise.allSettled([loadDetail(detail.run.id), refreshRuns()]);
      if (refreshed.some((item) => item.status === "rejected")) {
        setMessage(copy.decisionRefresh);
      }
      setPreviewUrl(nextPreviewUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.decisionFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-2xl border border-border/60 bg-surface/55 p-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-semibold text-foreground">{copy.queue}</h2><p className="text-xs text-muted">{filtered.length} / {runs.length}</p></div>
          <button type="button" onClick={() => void refreshRuns()} aria-label={copy.refreshQueue} className="rounded-lg border border-border/70 px-2.5 py-1.5 text-xs text-muted">↻</button>
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label={copy.statusFilter} className="mt-3 w-full rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground">
          <option value="active">{copy.active}</option>
          <option value="all">{copy.all}</option>
          <option value="awaiting_condition">awaiting_condition</option>
          <option value="needs_review">needs_review</option>
          <option value="proposal_ready">proposal_ready</option>
          <option value="approved_once">approved_once</option>
          <option value="rejected">rejected</option>
        </select>
        <div className="mt-3 space-y-2">
          {filtered.map((run) => (
            <button key={run.id} type="button" onClick={() => void loadDetail(run.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === run.id ? "border-gold/60 bg-gold/10" : "border-border/60 bg-background/35 hover:border-gold/30"}`}>
              <p className="truncate text-sm font-semibold text-foreground">{run.proposal?.product.title ?? run.payload.model?.toString() ?? run.intakeCode}</p>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted"><span>{run.condition ?? "condition?"}</span><span>{run.status}</span></div>
            </button>
          ))}
          {filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted">{copy.noRuns}</p> : null}
        </div>
      </aside>

      <div className="min-w-0">
        {message ? <p className="mb-4 rounded-xl border border-border/60 bg-surface/55 px-4 py-3 text-sm text-foreground" role="status">{message}</p> : null}
        {detail ? (
          <ProductIntakeRunDetail detail={detail} locale={locale} busy={busy} feedback={feedback} previewUrl={previewUrl} onFeedbackChange={setFeedback} onDecision={(decision) => void decide(decision)} />
        ) : (
          <div className="rounded-2xl border border-border/60 bg-surface/45 p-12 text-center text-muted">{copy.selectRun}</div>
        )}
      </div>
    </div>
  );
}
