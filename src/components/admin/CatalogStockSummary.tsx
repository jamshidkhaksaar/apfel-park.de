import { catalogToolsText, type Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/format';
import type { CatalogStockSummary as Summary } from '@/lib/catalog-stock-summary';

export default function CatalogStockSummary({ summary, locale, expanded = false }: { summary: Summary; locale: Locale; expanded?: boolean }) {
  const t = catalogToolsText[locale];
  return <section className="mt-5 space-y-3" aria-label={t.searchSummary}>
    <div className="grid grid-cols-3 gap-2 sm:gap-4">{[[t.listings,summary.listings],[t.units,summary.units],[t.subtotal,formatPrice(locale,summary.value)]].map(([label,value]) => <div key={label} className="min-w-0 rounded-xl border border-border bg-surface/40 p-3 sm:p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 break-words text-base font-semibold tabular-nums text-foreground sm:text-xl">{value}</p></div>)}</div>
    {summary.models.length ? <details open={expanded} className="rounded-xl border border-border p-3 sm:p-4"><summary className="cursor-pointer text-sm font-semibold">{t.searchSummary}</summary><div className="mt-3 max-h-80 overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-muted"><th className="pb-2 font-medium">{t.model}</th><th className="pb-2 text-right font-medium">{t.units}</th><th className="pb-2 text-right font-medium">{t.subtotal}</th></tr></thead><tbody>{summary.models.map((model,index) => <tr key={`${model.model}-${index}`} className="border-b border-border/40"><td className="py-2 pr-3 text-foreground">{model.model}</td><td className="py-2 text-right tabular-nums">{model.units}</td><td className="py-2 pl-3 text-right tabular-nums">{formatPrice(locale,model.value)}</td></tr>)}</tbody><tfoot><tr className="font-semibold text-foreground"><td className="pt-3">{t.total}</td><td className="pt-3 text-right tabular-nums">{summary.units}</td><td className="pt-3 pl-3 text-right tabular-nums">{formatPrice(locale,summary.value)}</td></tr></tfoot></table></div></details> : null}
  </section>;
}
