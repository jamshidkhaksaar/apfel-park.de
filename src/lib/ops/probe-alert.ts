import { createHash } from 'node:crypto';

/**
 * Decision logic for the public surface probe alert.
 *
 * Kept free of I/O on purpose: the systemd OnFailure unit supplies the journal
 * excerpt, the clock and the previous state, so the rules can be tested without
 * a journal, a mail server or a live deployment.
 */

/** Every probe failure is printed as one line starting with this marker. */
const FAILURE_MARKER = '[probe] ERROR:';

/** The same failure is not repeated in email more often than this. */
export const DEFAULT_ALERT_WINDOW_MS = 6 * 60 * 60 * 1000;

/** Journal lines quoted in the alert; enough to see what ran, not a torrent. */
const JOURNAL_TAIL_LINES = 8;

export type AlertState = {
  fingerprint: string;
  notifiedAtMs: number;
};

export type ProbeAlert = {
  fingerprint: string;
  failure: string | null;
  subject: string;
  body: string;
};

const meaningfulLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

/**
 * The check the probe named when it failed, or null when nothing was named.
 *
 * The probe exits on the first failure, so one run prints one marker line; a
 * journal window that reaches back over several runs therefore ends with the
 * newest failure, which is the one worth reporting. Older ones were reported
 * when they happened.
 */
export const extractNewestFailure = (journalText: string): string | null => {
  const named = meaningfulLines(journalText).filter((line) => line.includes(FAILURE_MARKER));
  return named.length > 0 ? named[named.length - 1] : null;
};

/**
 * systemd lines that describe the unit rather than the failure.
 *
 * A journal window reaches back over several invocations, so these are often
 * the newest lines even when the failure happened earlier: an older release
 * that crashed and a newer invocation that was skipped because it had nothing
 * to run. Quoting them would report a skip as a failure and push the actual
 * reason out of the line most people read first. The exit status still reaches
 * the reader in the body's journal tail, which quotes the run untrimmed.
 */
// Matched anywhere in the line: systemd prefixes some of these with the unit
// name and leaves others bare, so anchoring to the start would miss half.
const LIFECYCLE_LINE = [
  /\b(?:Starting|Started|Stopping|Stopped|Failed to start|Failed to stop)\b/,
  /\bMain process exited, code=/,
  /\bFailed with result\b/,
  /\bskipped\b|\bbeing skipped\b/,
  /\bUnknown key\b/,
];

const isLifecycleLine = (line: string): boolean => LIFECYCLE_LINE.some((pattern) => pattern.test(line));

/**
 * Identity of a failure, for suppressing repeats. Two runs that fail the same
 * way produce the same fingerprint; a different check, or a crash that never
 * named one, produces a different one and so is never suppressed.
 */
export const fingerprintOf = (lines: readonly string[]): string =>
  createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);

/**
 * Shortens a summary for the subject line. The cap is generous on purpose: the
 * failure this alert has to describe can be a whole shell error naming a file,
 * and a subject cut off before that reason tells the reader nothing. The body
 * always carries the full text untruncated.
 */
const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1)}…`;

const SUBJECT_SUMMARY_MAX = 200;

/**
 * Marks an alert that an operator sent by hand to prove delivery works. It
 * keeps the real wording, so the reader sees exactly what a real alert looks
 * like, and says in the first line that nothing is broken.
 */
const TEST_NOTE =
  'This is a test of the alert path, sent by hand. No probe failed and nothing is broken; the text below is what a real alert would contain.';

/**
 * The alert for one failed run. Falls back to the journal tail when the probe
 * died before it could name a check -- a missing script, a crash, a unit that
 * never started -- because that failure still has to reach a person.
 */
export const buildProbeAlert = (input: {
  unit: string;
  journalText: string;
  test?: boolean;
}): ProbeAlert => {
  const tail = meaningfulLines(input.journalText).slice(-JOURNAL_TAIL_LINES);
  const failure = extractNewestFailure(input.journalText);
  const reasons = tail.filter((line) => !isLifecycleLine(line));
  // The reason if the probe named one, else the newest line that is about the
  // failure, else the newest line at all so an alert is never blank.
  const summary =
    failure ?? reasons[reasons.length - 1] ?? tail[tail.length - 1] ?? 'the probe failed without any output';
  const subject = `[apfel-park.de] public surface probe failed: ${truncate(summary, SUBJECT_SUMMARY_MAX)}`;

  return {
    fingerprint: fingerprintOf(failure ? [failure] : [`no failure line, journal tail: ${tail.join(' | ')}`]),
    failure,
    subject: input.test ? `[TEST] ${subject}` : subject,
    body: [
      ...(input.test ? [TEST_NOTE, ''] : []),
      'The hourly public surface probe failed.',
      '',
      `Failed check: ${summary}`,
      `Unit: ${input.unit}`,
      '',
      'Journal tail:',
      ...tail.map((line) => `  ${line}`),
      '',
      'What it checks and how to run it by hand:',
      '  deployment/vps/README.md, section "Public surface probe"',
      '',
      `Full journal: journalctl -u ${input.unit} -n 40`,
      input.test
        ? 'This test did not read or write the suppression state, so it cannot hide a real failure.'
        : 'Re-sending is suppressed for 6 hours per distinct failure; state: shared/public-surface-alert-state.json',
    ].join('\n'),
  };
};

export const parseAlertState = (raw: string | null | undefined): AlertState | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { fingerprint, notifiedAtMs } = parsed as Partial<AlertState>;
    if (typeof fingerprint !== 'string' || !Number.isFinite(notifiedAtMs)) return null;
    return { fingerprint, notifiedAtMs: notifiedAtMs as number };
  } catch {
    // A corrupt state file must not stop the alert; it only loses suppression.
    return null;
  }
};

export const serializeAlertState = (state: AlertState): string => `${JSON.stringify(state, null, 2)}\n`;

/** True when this failure has not been emailed inside the window. */
export const shouldNotify = (
  previous: AlertState | null,
  fingerprint: string,
  nowMs: number,
  windowMs: number = DEFAULT_ALERT_WINDOW_MS,
): boolean => {
  if (previous === null) return true;
  if (previous.fingerprint !== fingerprint) return true;
  return nowMs - previous.notifiedAtMs >= windowMs;
};
