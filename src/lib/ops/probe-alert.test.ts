import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ALERT_WINDOW_MS,
  buildProbeAlert,
  extractNewestFailure,
  fingerprintOf,
  parseAlertState,
  serializeAlertState,
  shouldNotify,
} from './probe-alert';

const UNIT = 'apfel-park-public-surface-probe.service';

// Copied from a real failing run, so the parsing is tested against what the
// probe actually prints rather than a tidied version of it.
const ASSET_FAILURE =
  '[probe] ERROR: older release 20261026T125623Z-cf6a4540 no longer serves /_next/static/build-1789154340345/_buildManifest.js (404); the /_next/static alias must keep serving the shared archive';

const HEALTHY_RUN = [
  '[probe] older release asset continuity',
  '[probe]   20261026T130557Z-82764a1d -> /_next/static/build-1793020141817/_buildManifest.js 200',
  '[probe] markdown twins',
  '[probe]   /de/about.md -> text/markdown; charset=utf-8',
  '[probe] public surface OK',
].join('\n');

const CRASHED_RUN = [
  'apfel-park-public-surface-probe.service: Main process exited, code=exited, status=127/n/a',
  "apfel-park-public-surface-probe.service: Failed with result 'exit-code'.",
  '/usr/bin/bash: /srv/apfel-park/app/current/deployment/vps/scripts/probe-public-surface.sh: No such file or directory',
].join('\n');

// Verbatim from the host: an older crash, then later invocations that systemd
// skipped because the deployed release had no probe in it yet. The skip is the
// newest line and must not be reported as the failure.
const CRASH_THEN_SKIPPED = [
  'Starting apfel-park-public-surface-probe.service - Probe the public Apfel Park surface (older assets, markdown twins) on the origin...',
  '/usr/bin/bash: /srv/apfel-park/app/current/deployment/vps/scripts/probe-public-surface.sh: No such file or directory',
  'apfel-park-public-surface-probe.service: Main process exited, code=exited, status=127/n/a',
  "apfel-park-public-surface-probe.service: Failed with result 'exit-code'.",
  'apfel-park-public-surface-probe.service - Probe the public Apfel Park surface (older assets, markdown twins) on the origin skipped, unmet condition check ConditionPathExists=/srv/apfel-park/app/current/deployment/vps/scripts/probe-public-surface.sh',
].join('\n');

describe('extractNewestFailure', () => {
  it('finds the named check', () => {
    expect(extractNewestFailure(ASSET_FAILURE)).toBe(ASSET_FAILURE);
  });

  it('ignores a healthy run', () => {
    expect(extractNewestFailure(HEALTHY_RUN)).toBeNull();
  });

  it('keeps only the newest failure when the journal holds several runs', () => {
    const older = '[probe] ERROR: an older failure that was already reported';
    expect(extractNewestFailure([older, ASSET_FAILURE].join('\n'))).toBe(ASSET_FAILURE);
    expect(extractNewestFailure([ASSET_FAILURE, older].join('\n'))).toBe(older);
  });
});

describe('buildProbeAlert', () => {
  it('names the failed check, the unit and the journal tail', () => {
    const alert = buildProbeAlert({ unit: UNIT, journalText: ASSET_FAILURE });
    expect(alert.subject).toContain('public surface probe failed');
    expect(alert.subject).toContain('no longer serves');
    expect(alert.body).toContain(`Unit: ${UNIT}`);
    expect(alert.body).toContain('journalctl -u apfel-park-public-surface-probe.service -n 40');
    expect(alert.body).toContain('Public surface probe');
  });

  it('still alerts when the probe died without naming a check', () => {
    const alert = buildProbeAlert({ unit: UNIT, journalText: CRASHED_RUN });
    expect(alert.failure).toBeNull();
    // The subject is what most people see first, so it has to carry the reason
    // rather than cut it off: a crash line leads with the interpreter and the
    // path, and the reason is at the end.
    expect(alert.subject).toContain('No such file or directory');
    expect(alert.body).toContain('status=127/n/a');
  });

  it('reports the reason, not the unit state, when a skipped run follows the crash', () => {
    const alert = buildProbeAlert({ unit: UNIT, journalText: CRASH_THEN_SKIPPED });
    expect(alert.subject).toContain('No such file or directory');
    // Reporting the skip would send the reader after the wrong thing.
    expect(alert.subject).not.toContain('skipped');
    // The run itself is still quoted untrimmed in the body, status included.
    expect(alert.body).toContain('status=127/n/a');
  });

  it('labels a hand-sent test so nobody mistakes it for a real failure', () => {
    const real = buildProbeAlert({ unit: UNIT, journalText: ASSET_FAILURE });
    const test = buildProbeAlert({ unit: UNIT, journalText: ASSET_FAILURE, test: true });

    expect(test.subject.startsWith('[TEST] ')).toBe(true);
    expect(test.subject).toContain('public surface probe failed');
    expect(test.body).toContain('No probe failed and nothing is broken');
    expect(real.body).not.toContain('No probe failed and nothing is broken');
    // The suppression line would be a lie in a mail that records nothing.
    expect(test.body).toContain('did not read or write the suppression state');
    expect(test.body).not.toContain('Re-sending is suppressed');
    expect(real.body).toContain('Re-sending is suppressed');
    // Test mode changes the presentation only, never what was parsed.
    expect(test.fingerprint).toBe(real.fingerprint);
  });

  it('still alerts when the journal holds nothing but unit state', () => {
    const alert = buildProbeAlert({
      unit: UNIT,
      journalText: "apfel-park-public-surface-probe.service: Failed with result 'exit-code'.",
    });
    expect(alert.failure).toBeNull();
    expect(alert.subject).toContain('Failed with result');
  });

  it('fingerprints the same failure the same way and a different one differently', () => {
    const first = buildProbeAlert({ unit: UNIT, journalText: ASSET_FAILURE });
    const again = buildProbeAlert({ unit: UNIT, journalText: [HEALTHY_RUN, ASSET_FAILURE].join('\n') });
    expect(again.fingerprint).toBe(first.fingerprint);

    const different = buildProbeAlert({ unit: UNIT, journalText: CRASHED_RUN });
    expect(different.fingerprint).not.toBe(first.fingerprint);
  });
});

describe('shouldNotify', () => {
  const fingerprint = fingerprintOf([ASSET_FAILURE]);
  const now = 1_700_000_000_000;

  it('alerts when nothing was sent before', () => {
    expect(shouldNotify(null, fingerprint, now)).toBe(true);
  });

  it('suppresses the same failure inside the window', () => {
    expect(shouldNotify({ fingerprint, notifiedAtMs: now - DEFAULT_ALERT_WINDOW_MS + 1 }, fingerprint, now)).toBe(false);
  });

  it('alerts again once the window has passed', () => {
    expect(shouldNotify({ fingerprint, notifiedAtMs: now - DEFAULT_ALERT_WINDOW_MS }, fingerprint, now)).toBe(true);
  });

  it('never suppresses a different failure', () => {
    expect(shouldNotify({ fingerprint: 'something-else', notifiedAtMs: now }, fingerprint, now)).toBe(true);
  });
});

describe('alert state', () => {
  it('round-trips', () => {
    const state = { fingerprint: 'abc123', notifiedAtMs: 1_700_000_000_000 };
    expect(parseAlertState(serializeAlertState(state))).toEqual(state);
  });

  it('treats a corrupt file as no state rather than failing the alert', () => {
    expect(parseAlertState('{not json')).toBeNull();
    expect(parseAlertState('{"fingerprint":"abc"}')).toBeNull();
    expect(parseAlertState('')).toBeNull();
    expect(parseAlertState(null)).toBeNull();
  });
});
