/**
 * Black Week dates, calculated per year so the campaign switches itself on
 * and off every November without code changes.
 *
 *   Black Friday  = the day after the fourth Thursday of November
 *   Black Week    = Monday before Black Friday 00:00 → Cyber Monday 23:59
 *   Teaser        = four weeks before the start
 *
 * All times are Europe/Berlin; late October to early December is always CET
 * (+01:00), so the offset is fixed.
 */

export type CampaignDates = {
  year: number;
  teaserStartsAt: string;
  startsAt: string;
  endsAt: string;
  /** Black Friday itself (yyyy-mm-dd). */
  blackFriday: string;
  de: { start: string; startShort: string; bf: string; bfShort: string; end: string; endShort: string; range: string };
  en: { start: string; bf: string; bfShort: string; end: string; range: string };
};

const pad = (value: number) => String(value).padStart(2, "0");
const iso = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const addDays = (date: Date, days: number) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_EN_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const cache = new Map<number, CampaignDates>();

export function blackWeekDates(year: number): CampaignDates {
  const cached = cache.get(year);
  if (cached) return cached;
  const novFirst = new Date(Date.UTC(year, 10, 1));
  const firstThursday = 1 + ((4 - novFirst.getUTCDay() + 7) % 7);
  const blackFriday = new Date(Date.UTC(year, 10, firstThursday + 21 + 1));
  const start = addDays(blackFriday, -4);
  const end = addDays(blackFriday, 3);
  const teaser = addDays(start, -28);

  const deDay = (date: Date) => `${date.getUTCDate()}. ${MONTHS_DE[date.getUTCMonth()]}`;
  const deShort = (date: Date) => `${date.getUTCDate()}.${date.getUTCMonth() + 1}.`;
  const enDay = (date: Date) => `${date.getUTCDate()} ${MONTHS_EN[date.getUTCMonth()]}`;
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();

  const dates: CampaignDates = {
    year,
    teaserStartsAt: `${iso(teaser)}T00:00:00+01:00`,
    startsAt: `${iso(start)}T00:00:00+01:00`,
    endsAt: `${iso(end)}T23:59:59+01:00`,
    blackFriday: iso(blackFriday),
    de: {
      start: deDay(start),
      startShort: deShort(start),
      bf: deDay(blackFriday),
      bfShort: deShort(blackFriday),
      end: deDay(end),
      endShort: deShort(end),
      range: sameMonth ? `${start.getUTCDate()}.–${deDay(end)}` : `${deDay(start)} – ${deDay(end)}`,
    },
    en: {
      start: enDay(start),
      bf: enDay(blackFriday),
      bfShort: `${blackFriday.getUTCDate()} ${MONTHS_EN_SHORT[blackFriday.getUTCMonth()]}`,
      end: enDay(end),
      range: sameMonth ? `${start.getUTCDate()}–${enDay(end)}` : `${enDay(start)} – ${enDay(end)}`,
    },
  };
  cache.set(year, dates);
  return dates;
}

/**
 * The campaign that matters right now: this calendar year's Black Week.
 * After it ends the phase is "after" until 31 Dec, then "off" until the next
 * teaser in late October.
 */
export const currentBlackWeek = (now: Date = new Date()): CampaignDates =>
  blackWeekDates(Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Berlin", year: "numeric" }).format(now)));
