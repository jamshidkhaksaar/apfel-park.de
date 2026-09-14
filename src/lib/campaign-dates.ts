const berlin = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export const campaignDateForInput = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return berlin.format(date).replace(' ', 'T').slice(0, 16);
};

/** Offset-less admin input is Hamburg wall time, never the server/browser timezone. */
export const campaignDateToIso = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!match) throw new Error('invalid_date');
  const [,y,m,d,h,min,s='00',ms='0',zone] = match;
  const utc = Date.UTC(+y,+m-1,+d,+h,+min,+s,+ms.padEnd(3,'0'));
  const naive = new Date(utc);
  if (+y < 2000 || +y > 2100 || naive.getUTCFullYear() !== +y || naive.getUTCMonth() !== +m-1 || naive.getUTCDate() !== +d || +h > 23 || +min > 59 || +s > 59) throw new Error('invalid_date');
  if (zone) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error('invalid_date');
    return date.toISOString();
  }
  const wall = `${y}-${m}-${d}T${h}:${min}:${s}`;
  const candidates = [60,120].map(offset => new Date(utc-offset*60_000))
    .filter(date => berlin.format(date).replace(' ','T') === wall);
  if (candidates.length !== 1) throw new Error(candidates.length ? 'ambiguous_date' : 'invalid_date');
  return candidates[0].toISOString();
};

export const campaignWindow = (starts?: string | null, ends?: string | null) => {
  const startsAt = campaignDateToIso(starts), endsAt = campaignDateToIso(ends);
  if (startsAt && endsAt && endsAt <= startsAt) throw new Error('invalid_window');
  return { startsAt, endsAt };
};

export const campaignErrorMessage = (code: string, locale: 'de' | 'en'): string => {
  const messages: Record<string, [string,string]> = {
    repair_scope_only: ['Reparaturkampagnen bitte getrennt von Produktkampagnen anlegen.', 'Create repair campaigns separately from product campaigns.'],
    invalid_repair_dates: ['Bitte gültige konkrete Aktionstage auswählen; mindestens ein Tag darf noch nicht vergangen sein.', 'Choose valid specific promotion dates, including at least one date that has not passed.'],
    invalid_window: ['Das Ende muss nach dem Start liegen. Bitte Datum und Uhrzeit prüfen.', 'The end must be later than the start. Check both the date and time.'],
    invalid_date: ['Bitte ein gültiges Datum und eine gültige Uhrzeit in Hamburg eingeben. Diese Uhrzeit kann bei der Zeitumstellung entfallen.', 'Enter a valid date and Hamburg time. Some times do not exist during the clock change.'],
    ambiguous_date: ['Diese Uhrzeit kommt bei der Zeitumstellung zweimal vor. Bitte eine Uhrzeit außerhalb der Umstellung wählen.', 'This time occurs twice during the clock change. Choose a time outside the transition.'],
    invalid_code: ['Der Code braucht 3–64 Zeichen: Buchstaben, Zahlen, Bindestrich oder Unterstrich.', 'Use 3–64 letters, numbers, hyphens or underscores for the code.'],
    invalid_discount: ['Bitte einen gültigen Rabatt eingeben (Prozent: größer als 0 bis 100).', 'Enter a valid discount (percentage: greater than 0 and at most 100).'],
  };
  return messages[code]?.[locale === 'de' ? 0 : 1] ?? (locale === 'de' ? 'Speichern fehlgeschlagen. Bitte Eingaben prüfen und erneut versuchen.' : 'Could not save. Check the fields and try again.');
};
