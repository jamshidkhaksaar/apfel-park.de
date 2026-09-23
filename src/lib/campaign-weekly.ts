import { campaignDateToIso } from './campaign-dates';

const berlinDay = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
});

export const hamburgCalendarDate = (date = new Date()): string => berlinDay.format(date);

/** ISO weekdays: Monday=1, Sunday=7. The calendar date is in Hamburg. */
export const weekdayForDate = (date: string): number => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('invalid_weekly_days');
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('invalid_weekly_days');
  return parsed.getUTCDay() || 7;
};

export const normalizeWeeklyDays = (input: unknown): number[] => {
  const raw = input && typeof input === 'object' ? (input as { weeklyDays?: unknown }).weeklyDays : undefined;
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > 7 || raw.some(day => !Number.isInteger(day) || day < 1 || day > 7))
    throw new Error('invalid_weekly_days');
  return [...new Set(raw as number[])].sort((a, b) => a - b);
};

export const weeklyDayIsActive = (days: number[], now = new Date()): boolean =>
  days.length > 0 && days.includes(weekdayForDate(hamburgCalendarDate(now)));

export const currentWeeklyEnd = (days: number[], now = new Date()): string | null =>
  weeklyDayIsActive(days, now) ? campaignDateToIso(`${hamburgCalendarDate(now)}T23:59:59`) : null;

export const upcomingWeeklyDates = (days: number[], count = 4, now = new Date()): string[] => {
  if (!days.length || count < 1) return [];
  const start = Date.parse(`${hamburgCalendarDate(now)}T12:00:00Z`);
  const result: string[] = [];
  for (let offset = 0; offset < 35 && result.length < count; offset++) {
    const date = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
    if (days.includes(weekdayForDate(date))) result.push(date);
  }
  return result;
};
