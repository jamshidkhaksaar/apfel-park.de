// CLI for the unused-source audit: prints the candidates and sets the exit code.
// The reachability graph lives in ./lib/audit-unused-source-core.mjs so tests can
// run it against a fixture tree instead of this repository.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditUnusedSource } from './lib/audit-unused-source-core.mjs';

const rootFlag = process.argv.indexOf('--root');
const root = rootFlag === -1
  ? fileURLToPath(new URL('../', import.meta.url))
  : path.resolve(process.argv[rootFlag + 1] ?? '');

const { checked, candidates, computedImports } = auditUnusedSource({ root });

console.log(`${checked} source/script files checked; ${candidates.length} unreachable source-file candidates.`);
for (const file of candidates) console.log(`  REVIEW ${file}`);
if (computedImports.length) console.log(`Computed module loading requires manual review in: ${computedImports.join(', ')}`);
console.log('This audit does not classify HTTP endpoints, public assets, CSS, or individual exports as unused.');
process.exitCode = candidates.length ? 1 : 0;
