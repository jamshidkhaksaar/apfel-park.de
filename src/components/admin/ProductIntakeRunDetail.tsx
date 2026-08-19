"use client";

import Image from "next/image";

import type { ProductIntakeRunDetail as IntakeDetail } from "@/lib/product-intake/types";
import { adminDictionary } from "@/lib/admin-i18n";
import ProductIntakeEvidencePanel from "./ProductIntakeEvidencePanel";

type Props = {
  detail: IntakeDetail;
  locale: "de" | "en";
  busy: boolean;
  feedback: string;
  previewUrl: string | null;
  onFeedbackChange: (value: string) => void;
  onDecision: (decision: "approve" | "reject" | "request_changes") => void;
};

const display = (value: string | number | null | undefined) => value ?? "—";

export default function ProductIntakeRunDetail({
  detail,
  locale,
  busy,
  feedback,
  previewUrl,
  onFeedbackChange,
  onDecision,
}: Props) {
  const { run, assets, events } = detail;
  const proposal = run.proposal;
  const copy = adminDictionary[locale].productIntakePage;
  const canReview = Boolean(proposal && run.proposalHash && ["proposal_ready", "needs_review", "approved_once", "approved_twice"].includes(run.status));
  const canApprove = Boolean(
    canReview && run.validation.valid
    && !(proposal?.operation === "update" && run.approvalCount >= 1 && run.mode !== "live")
    && !(proposal?.operation === "create" && run.status === "approved_twice" && run.mode !== "live"),
  );
  const canRequestChanges = Boolean(
    canReview && !(run.mode === "live" && proposal?.operation === "create" && run.targetProductId && run.approvalCount > 0),
  );

  return (
    <div className="min-w-0 space-y-5">
      <section className="rounded-2xl border border-border/60 bg-surface/55 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{run.condition ?? copy.missingCondition}</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">{proposal?.product.title ?? run.intakeCode}</h2>
            <p className="mt-1 text-sm text-muted">{run.intakeCode} · {run.source} · {run.submittedByRole} · v{run.version}</p>
          </div>
          <span className="rounded-full border border-border/70 bg-background/45 px-3 py-1 text-xs font-semibold text-muted">{run.status}</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [copy.operation, proposal?.operation],
            [copy.match, run.matchResult.state],
            [copy.price, proposal?.changes.price == null ? null : `${proposal.changes.price.toFixed(2)} €`],
            [copy.quantity, proposal?.changes.inventory ? `${proposal.changes.inventory.mode}: ${proposal.changes.inventory.quantity}` : null],
            ["SKU", proposal?.target.sku],
            ["GTIN", proposal?.target.gtin],
            ["MPN", proposal?.target.mpn],
            [copy.hardwareModel, proposal?.target.hardwareModel],
            [copy.battery, proposal?.product.batteryHealth == null ? null : `${proposal.product.batteryHealth}%`],
            [copy.approvals, `${run.approvalCount}/2`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-border/60 bg-background/40 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-foreground">{display(value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <h3 className="font-semibold text-foreground">{copy.blockers} ({run.validation.blockers.length})</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {run.validation.blockers.length ? run.validation.blockers.map((item) => <li key={item.code}>• {item.message}</li>) : <li>{copy.none}</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="font-semibold text-foreground">{copy.warnings} ({run.validation.warnings.length})</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {run.validation.warnings.length ? run.validation.warnings.map((item) => <li key={item.code}>• {item.message}</li>) : <li>{copy.none}</li>}
          </ul>
        </div>
      </section>

      {run.matchResult.candidates.length > 0 ? (
        <section className="rounded-2xl border border-border/60 bg-surface/45 p-5">
          <h3 className="font-semibold text-foreground">{copy.matchCandidates}</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {run.matchResult.candidates.map((candidate) => (
              <div key={candidate.id} className="rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
                <p className="font-semibold text-foreground">{candidate.title}</p>
                <p className="mt-1 break-all text-xs text-muted">{candidate.id} · {candidate.sku ?? "no SKU"} · {candidate.condition}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {proposal ? <ProductIntakeEvidencePanel proposal={proposal} validation={run.validation} locale={locale} /> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-surface/45 p-5">
          <h3 className="font-semibold text-foreground">{copy.assetsRights} ({assets.length})</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {assets.length ? assets.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
                {asset.visionUrl ? <Image src={asset.visionUrl} alt={`${asset.kind} evidence`} width={320} height={240} unoptimized className="aspect-[4/3] w-full object-contain" /> : null}
                <p className="p-2 text-xs text-muted">{asset.kind} · {String(asset.metadata.assetType ?? "asset")} · {asset.rightsBasis}</p>
              </div>
            )) : <p className="col-span-full text-sm text-muted">{copy.noAssets}</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-surface/45 p-5">
          <h3 className="font-semibold text-foreground">Audit ({events.length})</h3>
          <ol className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm text-muted">
            {events.map((event) => <li key={event.id}>#{event.eventNumber} {event.eventType} · {event.actorId}</li>)}
          </ol>
        </div>
      </section>

      <section className="rounded-2xl border border-gold/25 bg-gold/5 p-5">
        <p className="text-sm font-semibold text-foreground">{run.mode === "shadow" ? copy.shadowNotice : copy.liveNotice}</p>
        <textarea value={feedback} onChange={(event) => onFeedbackChange(event.target.value)} rows={3} maxLength={1000} aria-label={copy.feedback} placeholder={copy.feedback} className="mt-3 w-full rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={!canApprove || busy} onClick={() => onDecision("approve")} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
            {run.mode === "live" && run.status === "approved_twice"
              ? copy.retryPublication
              : run.mode === "live" && proposal?.operation === "update" && run.status === "approved_once"
                ? copy.retryApplication
              : run.mode === "live" && run.status === "approved_once" && !run.targetProductId
                ? copy.retryDraft
                : run.approvalCount === 0
                  ? copy.firstApproval
                  : copy.secondApproval}
          </button>
          <button type="button" disabled={!canRequestChanges || busy || !feedback.trim()} onClick={() => onDecision("request_changes")} className="rounded-xl border border-border/70 px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40">{copy.requestChanges}</button>
          <button type="button" disabled={!canReview || busy || !feedback.trim()} onClick={() => onDecision("reject")} className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 disabled:opacity-40">{copy.reject}</button>
          {previewUrl ? <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-gold/40 px-4 py-2 text-sm font-semibold text-gold">{copy.openPreview}</a> : null}
        </div>
      </section>
    </div>
  );
}
