import { describe, expect, it } from 'vitest';
import { dueReportKinds, previousReportPeriod, reportPeriod } from './report-periods';

const at = (date: string): Date => new Date(`${date}T12:00:00Z`);

describe('scheduled shop report periods', () => {
  it('reports the current Berlin shop day', () => {
    expect(reportPeriod('daily', at('2026-11-05'))).toMatchObject({
      kind: 'daily',
      from: '2026-11-05',
      to: '2026-11-05',
    });
  });

  it('reports Sunday through Saturday for the weekly run', () => {
    expect(reportPeriod('weekly', at('2026-11-07'))).toMatchObject({
      kind: 'weekly',
      from: '2026-11-01',
      to: '2026-11-07',
    });
  });

  it('reports the previous calendar month for the monthly run', () => {
    expect(reportPeriod('monthly', at('2026-11-05'))).toMatchObject({
      kind: 'monthly',
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(reportPeriod('monthly', at('2026-03-01'))).toMatchObject({
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });

  it('emits weekly on Saturday and monthly on the first', () => {
    expect(dueReportKinds(at('2026-11-05'))).toEqual(['daily']);
    expect(dueReportKinds(at('2026-11-07'))).toEqual(['daily', 'weekly']);
    expect(dueReportKinds(at('2026-12-01'))).toEqual(['daily', 'monthly']);
  });

  it('compares against the immediately preceding equal-length window', () => {
    const weekly = reportPeriod('weekly', at('2026-11-07'));
    expect(previousReportPeriod(weekly)).toMatchObject({ from: '2026-10-25', to: '2026-10-31' });
  });
});
