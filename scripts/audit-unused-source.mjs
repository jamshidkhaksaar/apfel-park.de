// CLI for the unused-source audit: prints the candidates and sets the exit code.
// The reachability graph lives in ./lib/audit-unused-source-core.mjs so tests can
// run it against a fixture tree instead of this repository.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditHealthProblems, auditUnusedSource } from './lib/audit-unused-source-core.mjs';

// Baseline for this repository: 999 files, 522 entry points, 2857 internal import
// edges. The floors sit far below that, so ordinary refactors pass while a walk
// or resolver that stops seeing the tree fails instead of reporting a clean run.
// Raise or lower them with AUDIT_MIN_CHECKED / AUDIT_MIN_EDGES if the repository
// genuinely shrinks.
const MIN_CHECKED_FILES = Number(process.env.AUDIT_MIN_CHECKED ?? 500);
const MIN_INTERNAL_EDGES = Number(process.env.AUDIT_MIN_EDGES ?? 1000);

const rootFlag = process.argv.indexOf('--root');
const root = rootFlag === -1
  ? fileURLToPath(new URL('../', import.meta.url))
  : path.resolve(process.argv[rootFlag + 1] ?? '');

const { checked, edges, candidates, computedImports } = auditUnusedSource({ root });

console.log(`${checked} source/script files checked; ${candidates.length} unreachable source-file candidate${candidates.length === 1 ? '' : 's'}; ${edges} internal imports resolved.`);
for (const file of candidates) console.log(`  REVIEW ${file}`);
if (computedImports.length) console.log(`Computed module loading requires manual review in: ${computedImports.join(', ')}`);
console.log('This audit does not classify HTTP endpoints, public assets, CSS, or individual exports as unused.');

// Fixture trees are tiny by design, so the floors apply to the real tree -- or
// when a test sets them explicitly.
const enforceFloors = rootFlag === -1 || process.env.AUDIT_MIN_EDGES !== undefined || process.env.AUDIT_MIN_CHECKED !== undefined;
const healthProblems = enforceFloors
  ? auditHealthProblems({ checked, edges, minChecked: MIN_CHECKED_FILES, minEdges: MIN_INTERNAL_EDGES })
  : [];
for (const problem of healthProblems) console.error(`  HEALTH ${problem}`);
if (healthProblems.length) {
  console.error('[audit:unused] resolver health check failed: this audit followed too little of the tree to trust a clean result.');
}
process.exitCode = candidates.length || healthProblems.length ? 1 : 0;
