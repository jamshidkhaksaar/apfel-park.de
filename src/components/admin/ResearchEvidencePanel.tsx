'use client';

import type { ProductResearchResult } from '@/lib/product-research-core';

export default function ResearchEvidencePanel({ research, locale }: { research: ProductResearchResult; locale: 'de' | 'en' }): React.ReactNode {
  const de = locale === 'de';
  return <aside className="w-full min-w-0 rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs" aria-label={de ? 'Recherchequellen und Prüfhilfe' : 'Research sources and review notes'}>
    <p className="font-semibold">{de ? 'Offizielle Quellen · vor dem Speichern prüfen' : 'Official sources · review before saving'}</p>
    <ul className="mt-2 space-y-1 break-words">
      {(research.researchSources ?? []).map(source => <li key={source.url}>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-block min-h-11 py-2 text-gold underline underline-offset-2">{source.title || new URL(source.url).hostname}</a>
        <span className="ml-2 text-muted">{source.retrievedAt.slice(0, 10)}</span>
      </li>)}
    </ul>
    {(research.gtinSuggestion || research.mpnSuggestion || research.hardwareModelSuggestion) ? <div className="mt-3 rounded-lg border border-border p-2">
      <p className="font-semibold">{de ? 'Aus dem Foto erkannt, nicht automatisch eingetragen' : 'Read from the photo, not entered automatically'}</p>
      {research.gtinSuggestion ? <p>GTIN: <code className="break-all">{research.gtinSuggestion}</code></p> : null}
      {research.mpnSuggestion ? <p>MPN: <code className="break-all">{research.mpnSuggestion}</code></p> : null}
      {research.hardwareModelSuggestion ? <p>{de ? 'Hardware-Modell' : 'Hardware model'}: <code className="break-all">{research.hardwareModelSuggestion}</code></p> : null}
    </div> : null}
    {research.variantSuggestions?.length ? <details className="mt-3">
      <summary className="min-h-11 cursor-pointer py-3 font-semibold">{de ? 'Herstelleroptionen, kein Lagerbestand' : 'Manufacturer options, not stock offers'}</summary>
      <p className="text-muted">{research.variantSuggestions.map(variant => [variant.color, variant.storage].filter(Boolean).join(' · ')).join(' / ')}</p>
    </details> : null}
    <ul className="mt-3 space-y-1 text-muted">{(research.researchWarnings ?? []).map((warning, index) => <li key={index}>{warning}</li>)}</ul>
    {!de ? <p className="mt-2 text-muted">Listing drafts and detailed source notes use German, the primary store language.</p> : null}
  </aside>;
}
