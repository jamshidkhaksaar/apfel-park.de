import { conditionDescriptions, conditionLabels } from "@/lib/condition-labels";
import type { Locale } from "@/lib/i18n";
import type { ProductCondition } from "@/lib/products";

const ORDER: ProductCondition[] = ["new", "open_box", "used"];

const fulfilment: Record<Locale, string> = {
  de: "Abholung im LunaCenter, Wilhelm-Strauß-Weg 2b in Hamburg-Wilhelmsburg – oder versicherter Versand innerhalb Deutschlands in 1–3 Werktagen.",
  en: "Collect at the LunaCenter, Wilhelm-Strauß-Weg 2b in Hamburg-Wilhelmsburg – or insured delivery within Germany in 1–3 business days.",
};

const ConditionCards = ({ locale }: { locale: Locale }) => (
  <div className="grid gap-4 md:grid-cols-3">
    {ORDER.map((condition) => (
      <article key={condition} className="rounded-2xl border border-border/60 bg-surface/40 p-5">
        <h3 className="text-base font-semibold text-foreground">{conditionLabels[locale][condition]}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{conditionDescriptions[locale][condition]}</p>
      </article>
    ))}
  </div>
);

type ConditionExplainerProps = {
  locale: Locale;
  /** `section` for listing pages, `compact` for the collapsible product-page block. */
  variant?: "section" | "compact";
  className?: string;
};

/**
 * Plain server-rendered HTML, so buyers and AI answer engines read the same
 * three tiers that the product schema claims. No client JavaScript involved.
 */
export default function ConditionExplainer({ locale, variant = "section", className = "" }: ConditionExplainerProps) {
  const de = locale === "de";

  if (variant === "compact") {
    return (
      <details className={`mt-6 rounded-2xl border border-border/60 bg-surface/30 p-5 ${className}`}>
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          {de ? "Zustände erklärt: Neu, Open Box & Zustand A+" : "Conditions explained: new, Open Box & Grade A+"}
        </summary>
        <div className="mt-4">
          <ConditionCards locale={locale} />
        </div>
        <p className="mt-4 text-xs leading-6 text-muted">{fulfilment[locale]}</p>
      </details>
    );
  }

  return (
    <section className={`border-y border-border/60 bg-surface/30 py-10 ${className}`} aria-labelledby="condition-explainer-title">
      <div className="container-page">
        <h2 id="condition-explainer-title" className="text-2xl font-bold text-foreground md:text-3xl">
          {de ? "Unsere drei Zustände – klar beschrieben" : "Our three conditions – clearly described"}
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          {de
            ? "Jedes Gerät bei Apfel Park gehört genau einer dieser drei Kategorien an. Wir verwenden keine anderen Bezeichnungen."
            : "Every device at Apfel Park belongs to exactly one of these three categories. We use no other labels."}
        </p>
        <div className="mt-6">
          <ConditionCards locale={locale} />
        </div>
        <p className="mt-5 text-sm leading-6 text-muted">{fulfilment[locale]}</p>
      </div>
    </section>
  );
}
