// Points this checkout at the tracked git hooks so a fresh clone runs the
// pre-push gate without a manual step. Never fails an install: outside a git
// checkout -- release tarball, Docker build, exported tree -- there is nothing
// to do, and a hook is not worth breaking npm install over.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const hook = path.join(root, '.githooks', 'pre-push');
const WANTED = '.githooks';

const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });

try {
  if (!fs.existsSync(hook)) process.exit(0);
  if (git('rev-parse', '--git-dir').status !== 0) process.exit(0);

  const current = git('config', '--local', '--get', 'core.hooksPath');
  const configured = current.status === 0 ? current.stdout.trim() : '';
  if (configured === WANTED) process.exit(0);
  if (configured) {
    // Someone pointed git at their own hooks (husky, a shared setup). Do not
    // fight it; say what to run if they want this gate as well.
    console.log(`[hooks] core.hooksPath is "${configured}"; leaving it alone. Run "git config core.hooksPath ${WANTED}" to use the committed hooks.`);
    process.exit(0);
  }

  const result = git('config', '--local', 'core.hooksPath', WANTED);
  console.log(result.status === 0
    ? `[hooks] pre-push gate enabled from ${WANTED}/`
    : '[hooks] could not set core.hooksPath; run "npm run hooks:install" manually.');
} catch {
  // Installing a hook must never break an install.
}
process.exit(0);
