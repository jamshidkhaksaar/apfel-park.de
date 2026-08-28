import type { ProductProposal, ProposalValidation } from "@/lib/product-intake/types";
import { adminDictionary } from "@/lib/admin-i18n";

export default function ProductIntakeEvidencePanel({
  proposal,
  validation,
  locale,
}: {
  proposal: ProductProposal;
  validation: ProposalValidation;
  locale: "de" | "en";
}) {
  const copy = adminDictionary[locale].productIntakePage;
  return (
    <div className="min-w-0 space-y-4">
      <section className="min-w-0 rounded-2xl border border-border/60 bg-surface/45 p-5">
        <h3 className="font-semibold text-foreground">{copy.channelReadiness}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(validation.readiness).map(([channel, result]) => (
            <div key={channel} className="rounded-xl border border-border/60 bg-surface/60 p-3 shadow-sm text-black dark:text-foreground">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-black dark:text-heading">{channel}</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    result.ready
                      ? "border border-emerald-500/40 bg-emerald-500/15 text-black dark:text-emerald-300"
                      : "border border-amber-500/40 bg-amber-500/15 text-black dark:text-amber-300"
                  }`}
                >
                  {result.ready ? copy.ready : copy.blocked}
                </span>
              </div>
              {result.blockers.length ? <p className="mt-2 text-xs leading-5 text-black dark:text-amber-200 font-medium">{result.blockers.join(" · ")}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-surface/45 p-5">
        <h3 className="font-semibold text-foreground">{copy.listingPreview}</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {(["de", "en"] as const).map((language) => {
            const copy = proposal.listingPreview?.[language];
            return (
              <article key={language} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{language}</p>
                <h4 className="mt-2 font-semibold text-foreground">{copy?.title ?? "—"}</h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{copy?.description ?? "—"}</p>
                {copy?.conditionNote ? <p className="mt-3 text-xs text-muted">{copy.conditionNote}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-surface/45 p-5">
        <h3 className="font-semibold text-foreground">{copy.sourcesEvidence}</h3>
        <ul className="mt-3 space-y-2">
          {proposal.sources.map((source) => (
            <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gold underline underline-offset-4">{source.title || source.kind} ↗</a></li>
          ))}
        </ul>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-muted"><tr><th className="pb-2 pr-3">{copy.field}</th><th className="pb-2 pr-3">{copy.value}</th><th className="pb-2 pr-3">{copy.source}</th><th className="pb-2">{copy.confidence}</th></tr></thead>
            <tbody className="divide-y divide-border/50">
              {(proposal.facts ?? []).map((fact, index) => (
                <tr key={`${fact.field}-${index}`}><td className="py-2 pr-3 text-foreground">{fact.field}</td><td className="py-2 pr-3 text-muted">{String(fact.value)}</td><td className="py-2 pr-3"><a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-gold">{fact.sourceType}</a></td><td className="py-2 text-muted">{Math.round(fact.confidence * 100)}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {proposal.notes ? <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">{proposal.notes}</p> : null}
      </section>
    </div>
  );
}
