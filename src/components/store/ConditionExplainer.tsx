import ConditionBadge from "@/components/ConditionBadge";
import { conditionDescriptions } from "@/lib/condition-labels";
import type { Locale } from "@/lib/i18n";
import type { ProductCondition } from "@/lib/products";

const ORDER: ProductCondition[] = ["new", "open_box", "used"];

const copy = {
  de: {
    eyebrow: "Zustände",
    title: "Unsere drei Zustände – klar beschrieben",
    intro: "Jedes Gerät gehört genau einer dieser drei Kategorien an – wir verwenden keine anderen Bezeichnungen.",
    fulfilment: [
      "Abholung im LunaCenter, Wilhelm-Strauß-Weg 2b",
      "Versicherter Versand in Deutschland, 1–3 Werktage",
    ],
    compactTitle: "Zustände erklärt: Neu, Open Box & Zustand A+",
  },
  en: {
    eyebrow: "Conditions",
    title: "Our three conditions – clearly described",
    intro: "Every device belongs to exactly one of these three categories – we use no other labels.",
    fulfilment: [
      "Collect at the LunaCenter, Wilhelm-Strauß-Weg 2b",
      "Insured delivery in Germany, 1–3 business days",
    ],
    compactTitle: "Conditions explained: new, Open Box & Grade A+",
  },
} as const;

const PinIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10Z" />
    <circle cx="12" cy="11" r="2.2" />
  </svg>
);

const TruckIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </svg>
);

const Fulfilment = ({ locale, className = "" }: { locale: Locale; className?: string }) => (
  <ul className={`flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] leading-5 text-muted-strong md:text-xs ${className}`}>
    {copy[locale].fulfilment.map((item, index) => (
      <li key={item} className="flex items-center gap-1.5">
        {index === 0 ? <PinIcon /> : <TruckIcon />}
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/**
 * The three tiers as one compact key rather than three marketing cards: a
 * divided panel keeps the type small and scannable on a phone, and the chips
 * are the same ones product cards use, so the words are recognisable at the
 * point of sale. Server-rendered, no client JavaScript.
 */
const ConditionPanel = ({ locale }: { locale: Locale }) => (
  <div className="overflow-hidden rounded-2xl border border-border bg-background">
    <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
      {ORDER.map((condition) => (
        <article key={condition} className="p-4 md:p-5">
          <h3 className="text-sm font-semibold text-foreground">
            <ConditionBadge condition={condition} lang={locale} />
          </h3>
          <p className="mt-2 text-[13px] leading-5 text-muted">{conditionDescriptions[locale][condition]}</p>
        </article>
      ))}
    </div>
    <div className="border-t border-border bg-surface-strong/60 px-4 py-3 md:px-5">
      <Fulfilment locale={locale} />
    </div>
  </div>
);

type ConditionExplainerProps = {
  locale: Locale;
  /** `section` for listing pages, `compact` for the collapsible product-page block. */
  variant?: "section" | "compact";
  className?: string;
};

export default function ConditionExplainer({ locale, variant = "section", className = "" }: ConditionExplainerProps) {
  const text = copy[locale];

  if (variant === "compact") {
    return (
      <details className={`group mt-6 overflow-hidden rounded-2xl border border-border bg-background ${className}`}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          <span>{text.compactTitle}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="border-t border-border">
          <div className="divide-y divide-border">
            {ORDER.map((condition) => (
              <div key={condition} className="px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  <ConditionBadge condition={condition} lang={locale} />
                </h3>
                <p className="mt-1.5 text-[13px] leading-5 text-muted">{conditionDescriptions[locale][condition]}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border bg-surface-strong/60 px-4 py-3">
            <Fulfilment locale={locale} />
          </div>
        </div>
      </details>
    );
  }

  return (
    <section className={`border-y border-border bg-surface-strong/60 py-8 md:py-10 ${className}`} aria-labelledby="condition-explainer-title">
      <div className="container-page">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-text">{text.eyebrow}</p>
        <h2 id="condition-explainer-title" className="mt-1.5 text-2xl font-bold tracking-tight text-foreground md:text-[28px]">
          {text.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{text.intro}</p>
        <div className="mt-5">
          <ConditionPanel locale={locale} />
        </div>
      </div>
    </section>
  );
}
