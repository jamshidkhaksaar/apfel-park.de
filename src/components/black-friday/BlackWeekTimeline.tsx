import { blackFridayCopy } from "@/lib/black-friday";
import type { Locale } from "@/lib/i18n";

type DayKind = "start" | "live" | "weekend" | "blackFriday" | "cyberMonday";

const days: Array<{ date: string; kind: DayKind }> = [
  { date: "2026-11-23", kind: "start" },
  { date: "2026-11-24", kind: "live" },
  { date: "2026-11-25", kind: "live" },
  { date: "2026-11-26", kind: "live" },
  { date: "2026-11-27", kind: "blackFriday" },
  { date: "2026-11-28", kind: "weekend" },
  { date: "2026-11-29", kind: "weekend" },
  { date: "2026-11-30", kind: "cyberMonday" },
];

const berlinDate = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${date}T12:00:00Z`));

const weekdayOf = (date: string, lang: Locale) =>
  new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", {
    weekday: "short",
    timeZone: "Europe/Berlin",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "");

/**
 * The week at a glance. Dates are fixed campaign facts, not a countdown, so
 * this stays readable when JavaScript is off and never invents urgency.
 */
export default function BlackWeekTimeline({ lang }: { lang: Locale }) {
  const copy = blackFridayCopy[lang].timeline;
  const today = berlinDate(new Date().toISOString().slice(0, 10));

  const labelFor = (kind: DayKind) => {
    if (kind === "start") return copy.start;
    if (kind === "weekend") return copy.weekend;
    if (kind === "blackFriday") return copy.blackFriday;
    if (kind === "cyberMonday") return copy.cyberMonday;
    return copy.live;
  };

  return (
    <section aria-labelledby="bf-week-title" className="relative border-b border-border bg-[#08080a]">
      <div className="container-page py-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--brass)]">
              <span aria-hidden="true" className="h-px w-8 bg-[color:var(--brass)]/60" />
              {copy.eyebrow}
            </p>
            <h2 id="bf-week-title" className="mt-2.5 text-balance text-2xl font-semibold tracking-tight text-heading md:text-3xl">
              {copy.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{copy.note}</p>
          </div>

          <ul className="hidden shrink-0 gap-5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45 sm:flex">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 bg-[color:var(--signal)]" />
              {copy.blackFriday} · 27.11.
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 bg-[color:var(--brass)]" />
              {copy.cyberMonday} · 30.11.
            </li>
          </ul>
        </div>

        <ol className="mt-7 grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-8">
          {days.map(({ date, kind }) => {
            const isPeak = kind === "blackFriday";
            const isCyber = kind === "cyberMonday";
            const isToday = date === today;

            return (
              <li
                key={date}
                aria-current={isToday ? "date" : undefined}
                className={`relative flex min-h-[5.75rem] flex-col justify-between px-3 py-3 ${
                  isPeak
                    ? "bg-[#180a0c]"
                    : isCyber
                      ? "bg-[#12100b]"
                      : "bg-[#0a0a0c]"
                }`}
              >
                {(isPeak || isCyber) ? (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-0.5 ${isPeak ? "bg-[color:var(--signal)]" : "bg-[color:var(--brass)]"}`}
                  />
                ) : null}

                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                    {weekdayOf(date, lang)}
                  </span>
                  {isToday ? (
                    <>
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-white/70" />
                      <span className="sr-only">{copy.today}</span>
                    </>
                  ) : null}
                </span>

                <span
                  className={`mt-2 font-mono text-2xl leading-none tabular-nums ${
                    isPeak ? "text-[color:var(--signal)]" : isCyber ? "text-[color:var(--brass)]" : "text-white"
                  }`}
                >
                  {date.slice(8)}
                </span>

                <span
                  className={`mt-2 text-[9px] font-bold uppercase leading-3 tracking-[0.1em] ${
                    isPeak
                      ? "text-[color:var(--signal)]"
                      : isCyber
                        ? "text-[color:var(--brass)]"
                        : "text-white/40"
                  }`}
                >
                  {labelFor(kind)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
