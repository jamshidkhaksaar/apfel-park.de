import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { auditHealthProblems, auditUnusedSource } from '../../../scripts/lib/audit-unused-source-core.mjs';

// Guards the path handling in the audit: on Windows a naive comparison reported
// every file as unreachable, and the tempting "fix" -- normalizing until nothing
// is flagged -- would leave the gate passing while detecting nothing. A fixture
// with one genuinely dead file has to keep failing.
const write = (root: string, relative: string, contents: string) => {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents);
};

type FixtureOptions = { alias?: boolean; dead?: boolean };

const createFixture = ({ alias = false, dead = true }: FixtureOptions = {}) => {
  const root = mkdtempSync(path.join(tmpdir(), 'apfel-audit-'));
  write(root, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      module: 'esnext',
      moduleResolution: 'bundler',
      jsx: 'preserve',
      strict: true,
      // Same shape as the project tsconfig: paths declared without baseUrl.
      ...(alias ? { paths: { '@/*': ['./src/*'] } } : {}),
    },
  }, null, 2));
  write(root, 'src/lib/used.ts', 'export const used = "used";\n');
  write(root, 'src/app/page.tsx', alias
    ? 'import { used } from "../lib/used";\nimport { aliased } from "@/lib/aliased";\n\nexport default function Page() {\n  return used + aliased;\n}\n'
    : 'import { used } from "../lib/used";\n\nexport default function Page() {\n  return used;\n}\n');
  if (alias) write(root, 'src/lib/aliased.ts', 'export const aliased = "reached only through the alias";\n');
  if (dead) write(root, 'src/lib/dead.ts', 'export const dead = "nothing imports this";\n');
  return root;
};

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const cliPath = path.join(repoRoot, 'scripts/audit-unused-source.mjs');
const runCli = (root: string, env: Record<string, string | undefined> = {}) =>
  spawnSync(process.execPath, [cliPath, '--root', root], { encoding: 'utf8', env: { ...process.env, ...env } });

describe('unused-source audit', () => {
  it('flags the unreferenced file and spares the reachable ones, with normalized paths', () => {
    const root = createFixture();
    try {
      const { candidates } = auditUnusedSource({ root });
      expect(candidates).toEqual(['src/lib/dead.ts']);
      expect(candidates.some((file) => file.includes('\\'))).toBe(false);
      expect(candidates).not.toContain('src/lib/used.ts');
      expect(candidates).not.toContain('src/app/page.tsx');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // Almost every real import resolves through the tsconfig alias, so an alias
  // that stops resolving would mark most of src/ as dead at once.
  it('treats a file reached only through the @/ alias as reachable', () => {
    const root = createFixture({ alias: true });
    try {
      const { candidates } = auditUnusedSource({ root });
      expect(candidates).not.toContain('src/lib/aliased.ts');
      expect(candidates).toEqual(['src/lib/dead.ts']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits non-zero so the commit gate fails when a dead file exists', () => {
    const root = createFixture();
    try {
      const run = runCli(root);
      expect(run.status).toBe(1);
      expect(run.stdout).toContain('REVIEW src/lib/dead.ts');
      expect(run.stdout).toContain('1 unreachable source-file candidate');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // A tree where nothing resolves and nothing is flagged is the dangerous state:
  // it looks like a clean audit. It has to fail instead.
  it('fails loudly when almost no imports resolve, even with nothing flagged', () => {
    const root = createFixture({ dead: false });
    try {
      expect(auditHealthProblems({ checked: 4, edges: 2857, minChecked: 500, minEdges: 1000 })[0])
        .toContain('only 4 source/script files were found');

      const clean = runCli(root);
      expect(clean.status).toBe(0);
      expect(clean.stdout).toContain('0 unreachable source-file candidates');

      const starved = runCli(root, { AUDIT_MIN_EDGES: '9999' });
      expect(starved.status).toBe(1);
      expect(starved.stdout).toContain('0 unreachable source-file candidates');
      expect(starved.stderr).toContain('resolver health check failed');
      expect(starved.stderr).toContain('module resolution is likely broken');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
