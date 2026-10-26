#!/usr/bin/env node
/**
 * Email the owner when the public surface probe fails.
 *
 * Started by apfel-park-public-surface-probe-alert@.service, which the probe
 * service names in OnFailure=, so the systemd instance name is the failing
 * unit. Mail goes out through the application's own configuration (SMTP_*,
 * ADMIN_EMAILS from shared/app.env), so an alert has no second place to keep
 * credentials and cannot drift from the mail the shop already sends.
 *
 *   notify-surface-probe-failure.ts <failed-unit> [--dry-run] [--test]
 *
 * --dry-run prints the message and the recipient instead of sending it, which
 * is how the alert path can be checked without mailing anyone.
 *
 * --test sends a real mail through this same path, marked [TEST] and saying
 * nothing is broken, for the times when the question is whether delivery
 * itself works. It neither reads nor writes the suppression state, so a
 * hand-sent test can never hide the first real failure.
 *
 * Exit status is non-zero when the alert could not be delivered, so systemd
 * marks the alert unit failed as well instead of quietly doing nothing.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { sendOpsAlertEmail } from '../src/lib/email';
import {
  DEFAULT_ALERT_WINDOW_MS,
  buildProbeAlert,
  parseAlertState,
  serializeAlertState,
  shouldNotify,
} from '../src/lib/ops/probe-alert';

const DEFAULT_UNIT = 'apfel-park-public-surface-probe.service';
const DEFAULT_STATE = '/srv/apfel-park/app/shared/public-surface-alert-state.json';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const testMode = args.includes('--test');
const unit = args.find((argument) => !argument.startsWith('--')) ?? DEFAULT_UNIT;

const statePath = process.env.SURFACE_PROBE_ALERT_STATE?.trim() || DEFAULT_STATE;
const journalLines = Number(process.env.SURFACE_PROBE_ALERT_JOURNAL_LINES ?? '');
const configuredWindow = Number(process.env.SURFACE_PROBE_ALERT_WINDOW_MS ?? '');
const windowMs = Number.isFinite(configuredWindow) && configuredWindow > 0 ? configuredWindow : DEFAULT_ALERT_WINDOW_MS;

const readState = (file: string): string | null => {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return null;
  }
};

const writeState = (file: string, content: string): void => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
};

/** The failed run as systemd recorded it; every failure path is worth emailing. */
const readJournal = (): string => {
  try {
    return execFileSync(
      'journalctl',
      ['-u', unit, '-o', 'cat', '-n', String(Number.isFinite(journalLines) && journalLines > 0 ? journalLines : 80), '--no-pager'],
      { encoding: 'utf8' },
    );
  } catch (error) {
    return `journalctl could not read ${unit}: ${error instanceof Error ? error.message : String(error)}`;
  }
};

const recipient = (): string | null =>
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)[0] ??
  process.env.CONTACT_NOTIFICATION_EMAIL?.trim() ??
  null;

const main = async (): Promise<number> => {
  const alert = buildProbeAlert({ unit, journalText: readJournal(), test: testMode });
  const nowMs = Date.now();
  const previous = parseAlertState(readState(statePath));

  if (!testMode && !shouldNotify(previous, alert.fingerprint, nowMs, windowMs)) {
    const since = new Date(previous?.notifiedAtMs ?? nowMs).toISOString();
    console.log(`[alert] same failure already emailed ${since}; suppressing`);
    return 0;
  }

  const to = recipient();
  if (!to) {
    console.error('[alert] no recipient: set ADMIN_EMAILS or CONTACT_NOTIFICATION_EMAIL');
    return 1;
  }

  if (dryRun) {
    console.log(`[alert] dry run: would email ${to}\nsubject: ${alert.subject}\n\n${alert.body}`);
    return 0;
  }

  const result = await sendOpsAlertEmail(to, { subject: alert.subject, text: alert.body });
  if (!result.success) {
    console.error(`[alert] sending failed: ${result.error ?? 'unknown error'}`);
    return 1;
  }

  if (!testMode) writeState(statePath, serializeAlertState({ fingerprint: alert.fingerprint, notifiedAtMs: nowMs }));
  console.log(`[alert] emailed to ${to}: ${alert.subject}`);
  return 0;
};

void main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(`[alert] unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
