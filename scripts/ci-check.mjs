// The single definition of the checks a commit has to pass.
//
// Three callers run this one list, so none of them can quietly check less than
// the others:
//
//   * the deploy gate, deployment/vps/scripts/deploy-app.sh
//   * the GitHub workflow, .github/workflows/ci.yml
//   * a laptop or a server: `npm ci && npm run ci:check`
//
// That matters because the deploy used to spell the list out inline: a check
// added to the workflow did not reach the release gate, and a check added to
// the release gate did not reach a pull request.
//
// It stops deliberately at commit-level gates. Anything needing an assembled or
// deployed environment stays with the caller -- the deploy still builds
// `.next/standalone`, applies database migrations, runs the image-upload
// regression against a standalone server, health-checks the release, and probes
// the public surface on the origin.
//
// Dependencies must already be installed (`npm ci`): the deploy installs with
// `--include=dev` and CI restores a cached tree, so neither belongs in here.
//
// It exits non-zero at the first gate that fails, with that gate's own exit
// code, and names the gate on its last line of output.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const gates = [
  { name: 'lint', command: ['run', 'lint'], covers: 'ESLint over the source tree' },
  { name: 'typecheck', command: ['run', 'typecheck'], covers: 'tsc --noEmit' },
  { name: 'audit:unused', command: ['run', 'audit:unused'], covers: 'source files nothing reaches' },
  { name: 'test', command: ['test'], covers: 'the vitest suite' },
  { name: 'audit', command: ['audit', '--audit-level=high'], covers: 'high-severity advisories' },
  { name: 'build', command: ['run', 'build'], covers: 'the production build' },
];

if (!existsSync(new URL('../node_modules', import.meta.url))) {
  console.error('[ci:check] dependencies are missing; run `npm ci` first');
  process.exit(1);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const startedAt = Date.now();

console.log(`[ci:check] gates, in order: ${gates.map((gate) => gate.name).join(', ')}`);

for (const gate of gates) {
  console.log(`[ci:check] ${gate.name} -- ${gate.covers}`);
  const result = spawnSync(npm, gate.command, {
    stdio: 'inherit',
    // The build writes telemetry otherwise; CI used to set this per step.
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });

  if (result.error) {
    console.error(`[ci:check] could not run ${gate.name}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[ci:check] FAILED: ${gate.name} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

console.log(`[ci:check] all ${gates.length} gates passed in ${Math.round((Date.now() - startedAt) / 1000)}s`);
