import Link from "next/link";

import { blackFridayCopy } from "@/lib/black-friday";
import type { Locale } from "@/lib/i18n";

const icons = [
  // Condition: shield with a check
  <path key="shield" d="M12 3.2 4.8 6v5.7c0 4.2 2.9 7.2 7.2 8.7 4.3-1.5 7.2-4.5 7.2-8.7V6L12 3.2Z M8.8 11.8l2.1 2.1 4.3-4.4" />,
  // Checked pre-owned: sparkle
  <path key="spark" d="M12 3.5l1.7 5.3 5.3 1.7-5.3 1.7L12 17.5l-1.7-5.3L5 10.5l5.3-1.7L12 3.5Z M18.5 16v3.5 M16.8 17.8h3.5" />,
  // Invoice: document with lines
  <path key="receipt" d="M6.5 3.5h8l3.5 3.5v13.5H6.5V3.5Z M9.5 9h5 M9.5 12.5h5 M9.5 16h3" />,
  // Location: pin
  <path key="pin" d="M12 21s6.5-5.3 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.7 12 21 12 21Z M12 13.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />,
];

export default function BlackWeekTrust({ lang }: { lang: Locale }) {
  const copy = blackFridayCopy[lang].trustSection;

  return (
    <section aria-labelledby="bf-trust-title" className="bf-surface border-b border-border py-12 md:py-16">
      <div className="container-page">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--brass)]">
              <span aria-hidden="true" className="h-px w-8 bg-[color:var(--brass)]/60" />
              {copy.eyebrow}
            </p>
            <h2 id="bf-trust-title" className="mt-2.5 text-balance text-3xl font-semibold tracking-tight text-heading md:text-4xl">
              {copy.title}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted md:text-right">{copy.note}</p>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
          {copy.points.map((point, index) => (
            <article key={point.title} className="flex flex-col bg-[#0a0a0c] p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] tabular-nums tracking-[0.2em] text-[color:var(--brass)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 text-white/25"
                  aria-hidden="true"
                >
                  {icons[index]}
                </svg>
              </div>

              <h3 className="mt-6 text-base font-semibold leading-snug text-heading">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{point.text}</p>

              {point.href && point.linkLabel ? (
                <Link
                  href={`/${lang}${point.href}`}
                  className="group mt-auto pt-4 inline-flex items-center gap-1.5 self-start text-[11px] font-bold text-[color:var(--brass)] underline-offset-4 hover:underline"
                >
                  {point.linkLabel}
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
