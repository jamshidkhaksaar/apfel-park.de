export type ReportKind = 'daily' | 'weekly' | 'monthly';

export type ReportPeriod = {
  kind: ReportKind;
  from: string;
  to: string;
  label: string;
};

const isoDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export const addDays = (date: string, days: number): string => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

export const weekday = (date: string): number => new Date(`${date}T12:00:00Z`).getUTCDay();
export const dayOfMonth = (date: string): number => Number(date.slice(8, 10));

const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );

/**
 * Daily reports cover the current shop day, weekly reports cover Sunday through
 * Saturday (matching the till UI), and monthly reports cover the previous
 * calendar month because the scheduler runs on the first of the month.
 */
export const reportPeriod = (kind: ReportKind, now: Date = new Date()): ReportPeriod => {
  const today = isoDate(now);
  if (kind === 'daily') {
    return { kind, from: today, to: today, label: formatDate(today) };
  }
  if (kind === 'weekly') {
    const from = addDays(today, -weekday(today));
    const to = addDays(from, 6);
    return { kind, from, to, label: `${formatDate(from)} – ${formatDate(to)}` };
  }
  const end = addDays(`${today.slice(0, 7)}-01`, -1);
  const from = `${end.slice(0, 7)}-01`;
  return { kind, from, to: end, label: `${formatDate(from)} – ${formatDate(end)}` };
};

const reportLabels: Record<ReportKind, string> = {
  daily: 'Tagesbericht',
  weekly: 'Wochenbericht',
  monthly: 'Monatsbericht',
};

export const reportKindLabel = (kind: ReportKind): string => reportLabels[kind];

/** One daily run also emits the weekly report on Saturday and the monthly report on the 1st. */
export const dueReportKinds = (now: Date = new Date()): ReportKind[] => {
  const today = isoDate(now);
  const kinds: ReportKind[] = ['daily'];
  if (weekday(today) === 6) kinds.push('weekly');
  if (dayOfMonth(today) === 1) kinds.push('monthly');
  return kinds;
};

export const previousReportPeriod = (period: ReportPeriod): ReportPeriod => {
  const length =
    (Date.parse(`${period.to}T12:00:00Z`) - Date.parse(`${period.from}T12:00:00Z`)) / 86400000 + 1;
  const to = addDays(period.from, -1);
  const from = addDays(to, -(length - 1));
  return {
    ...period,
    from,
    to,
    label: `${formatDate(from)} – ${formatDate(to)}`,
  };
};
