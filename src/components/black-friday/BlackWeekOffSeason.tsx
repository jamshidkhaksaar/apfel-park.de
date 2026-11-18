import Link from "next/link";

import type { CampaignDates } from "@/lib/black-week-calendar";
import type { Locale } from "@/lib/i18n";
import { siteInfo } from "@/lib/site";

/**
 * Copy for /black-friday outside the campaign window. The URL stays live and
 * indexable all year (one permanent seasonal URL keeps its ranking), so off
 * season it answers "when is Black Friday?" for the next Black Week and points
 * to the regular shop. No prices or deals are promised here.
 */
export const offSeasonCopy = (locale: Locale, next: CampaignDates) => {
  const y = next.year;
  if (locale === "de") {
    return {
      metaTitle: `Black Friday ${y} – Black Week ab ${next.de.start}`,
      metaDescription: `Wann ist Black Friday ${y}? Die Apfel Park Black Week läuft vom ${next.de.start} bis ${next.de.end} ${y}, Black Friday ist am ${next.de.bf}. Bis dahin: geprüfte Smartphones mit Garantie im Shop in Hamburg-Wilhelmsburg.`,
      eyebrow: "Nächste Black Week",
      title: `Black Friday ${y}`,
      subtitle: `Black Week bei Apfel Park: ${next.de.range} ${y}`,
      intro: `Die nächste Black Week bei Apfel Park startet am ${next.de.start} ${y} und endet am Cyber Monday, ${next.de.end}. Etwa vier Wochen vorher startet hier der Countdown mit allen Infos.`,
      dates: [
        { label: "Start", value: next.de.start },
        { label: "Black Friday", value: next.de.bf },
        { label: "Cyber Monday · Ende", value: next.de.end },
      ],
      untilTitle: "Bis dahin im Shop",
      untilText: "Geprüfte Smartphones, Tablets und Zubehör zu fairen Preisen – mit Garantie, online und im Laden.",
      links: [
        { href: "/store", label: "Zum Shop" },
        { href: "/smartphones", label: "Smartphones" },
        { href: "/open-box", label: "Open Box" },
        { href: "/trade-in", label: "Handy verkaufen" },
      ],
      faqTitle: "Häufige Fragen",
      faq: [
        {
          question: `Wann ist Black Friday ${y}?`,
          answer: `Black Friday ist am ${next.de.bf} ${y}. Bei Apfel Park läuft die Black Week vom ${next.de.start} bis ${next.de.end} ${y} – online und im Shop in Hamburg-Wilhelmsburg.`,
        },
        {
          question: "Ab wann sehe ich die Black-Week-Angebote?",
          answer: `Rund vier Wochen vor dem Start erscheint hier der Countdown. Die Aktionspreise gelten ab dem ${next.de.start}.`,
        },
        {
          question: "Gilt die Garantie auch für Aktionsgeräte?",
          answer: "Ja. Für Aktionsgeräte gelten dieselben Garantie- und Rückgabebedingungen wie für alle anderen Geräte.",
        },
      ],
      visitTitle: "Komm vorbei",
      home: "Startseite",
    };
  }
  return {
    metaTitle: `Black Friday ${y} – Black Week from ${next.en.start}`,
    metaDescription: `When is Black Friday ${y}? Apfel Park Black Week runs from ${next.en.start} to ${next.en.end} ${y}; Black Friday is on ${next.en.bf}. Until then: checked smartphones with warranty at our Hamburg-Wilhelmsburg store.`,
    eyebrow: "Next Black Week",
    title: `Black Friday ${y}`,
    subtitle: `Black Week at Apfel Park: ${next.en.range} ${y}`,
    intro: `The next Black Week at Apfel Park starts on ${next.en.start} ${y} and ends on Cyber Monday, ${next.en.end}. About four weeks before, the countdown with all details starts here.`,
    dates: [
      { label: "Start", value: next.en.start },
      { label: "Black Friday", value: next.en.bf },
      { label: "Cyber Monday · End", value: next.en.end },
    ],
    untilTitle: "Until then in our shop",
    untilText: "Checked smartphones, tablets and accessories at fair prices – with warranty, online and in store.",
    links: [
      { href: "/store", label: "Go to shop" },
      { href: "/smartphones", label: "Smartphones" },
      { href: "/open-box", label: "Open Box" },
      { href: "/trade-in", label: "Sell your phone" },
    ],
    faqTitle: "FAQ",
    faq: [
      {
        question: `When is Black Friday ${y}?`,
        answer: `Black Friday is on ${next.en.bf} ${y}. At Apfel Park, Black Week runs from ${next.en.start} to ${next.en.end} ${y} – online and in our Hamburg-Wilhelmsburg store.`,
      },
      {
        question: "When will I see the Black Week offers?",
        answer: `The countdown appears here about four weeks before the start. Campaign prices apply from ${next.en.start}.`,
      },
      {
        question: "Does the warranty cover campaign devices?",
        answer: "Yes. Campaign devices come with the same warranty and return conditions as every other device.",
      },
    ],
    visitTitle: "Visit us",
    home: "Home",
  };
};

export default function BlackWeekOffSeason({ lang, next }: { lang: Locale; next: CampaignDates }) {
  const copy = offSeasonCopy(lang, next);
  return (
    <>
      <section className="border-b border-border bg-background py-14 md:py-20">
        <div className="container-page">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{copy.eyebrow}</p>
          <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading md:text-6xl">{copy.title}</h1>
          <p className="mt-3 text-lg font-semibold text-foreground md:text-xl">{copy.subtitle}</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{copy.intro}</p>
          <dl className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {copy.dates.map((date) => (
              <div key={date.label} className="rounded-2xl border border-border bg-surface p-5">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{date.label}</dt>
                <dd className="mt-1.5 text-xl font-bold text-heading">{date.value} {next.year}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-border bg-background py-12 md:py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold tracking-tight text-heading md:text-3xl">{copy.untilTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{copy.untilText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {copy.links.map((link, index) => (
              <Link key={link.href} href={`/${lang}${link.href}`} className={index === 0 ? "btn-primary" : "btn-secondary"}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-12 md:py-16">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-heading md:text-3xl">{copy.faqTitle}</h2>
          <div className="mt-6 border-y border-border">
            {copy.faq.map((entry) => (
              <div key={entry.question} className="border-b border-border py-4 last:border-b-0">
                <h3 className="text-sm font-semibold text-heading">{entry.question}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{entry.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="container-page">
          <h2 className="text-xl font-bold tracking-tight text-heading">{copy.visitTitle}</h2>
          <p className="mt-2 text-sm text-foreground">
            {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city}
            <span aria-hidden="true" className="mx-2 text-gold/50">·</span>
            {siteInfo.hours.days} {siteInfo.hours.time}
          </p>
        </div>
      </section>
    </>
  );
}
