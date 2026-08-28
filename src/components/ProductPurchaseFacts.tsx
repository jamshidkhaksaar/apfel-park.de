import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { getProductPageSignals, getSafeConditionNote } from "@/lib/product-page-presentation";
import type { ProductCondition } from "@/lib/products";

type Props = {
  locale: Locale;
  condition: ProductCondition;
  conditionNote?: string;
  model?: string;
  stock?: number;
  batteryHealth?: number;
  hasRealProductPhotos: boolean;
};

export default function ProductPurchaseFacts({
  locale,
  condition,
  conditionNote,
  model,
  stock,
  batteryHealth,
  hasRealProductPhotos,
}: Props) {
  const isGerman = locale === "de";
  const signals = getProductPageSignals({ locale, condition, stock, batteryHealth, hasRealProductPhotos });
  const safeConditionNote = getSafeConditionNote({ condition, model, note: conditionNote });
  const hasTransparency = condition !== "new" || safeConditionNote || signals.batteryLabel || signals.realPhotosLabel;

  return (
    <div className="mt-4 sm:mt-5">
      {hasTransparency ? (
        <div className="rounded-2xl border border-green/30 bg-green/5 px-4 py-3.5 text-sm text-muted">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-foreground">{signals.conditionTitle}</p>
            <span className="rounded-full border border-green/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-green">{signals.conditionLabel}</span>
          </div>
          {safeConditionNote ? <p className="mt-2 whitespace-pre-line leading-6">{safeConditionNote}</p> : null}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-foreground">
            {signals.realPhotosLabel ? <span>✓ {signals.realPhotosLabel}</span> : null}
            {signals.batteryLabel ? <span>✓ {signals.batteryLabel}</span> : null}
          </div>
          {condition !== "new" ? (
            <p className="mt-3 text-xs leading-5">
              {isGerman ? "Details zu Zustandskategorien und Ihren Rechten:" : "Details about condition categories and your rights:"}{" "}
              <Link href={`/${locale}/device-conditions`} className="font-medium text-foreground underline underline-offset-2 hover:text-gold">
                {isGerman ? "mehr erfahren" : "learn more"}
              </Link>
            </p>
          ) : null}

        </div>
      ) : null}
    </div>
  );
}
