import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve('@next/eslint-plugin-next'));
const { getRootDirs } = pluginRequire('./utils/get-root-dirs.js') as {
  getRootDirs: (context: { cwd: string; settings: { next?: { rootDir?: string | unknown[] } } }) => string[];
};

describe('Next ESLint root directory compatibility', () => {
  it('preserves the unconfigured project root', () => {
    expect(getRootDirs({ cwd: process.cwd(), settings: {} })).toEqual([process.cwd()]);
  });

  it('matches directory globs and arrays without expanding nested directories or files', () => {
    const root = mkdtempSync(join(tmpdir(), 'apfel-next-root-'));
    try {
      mkdirSync(join(root, 'app-a', 'nested'), { recursive: true });
      mkdirSync(join(root, 'app-b'));
      writeFileSync(join(root, 'app-file'), 'not a directory');
      const context = { cwd: root, settings: { next: { rootDir: `${root}/app-*` } } };
      // Next joins each root with /pages or /app. Absolute and relative paths
      // identify the same directories; tinyglobby returns relative paths.
      expect(getRootDirs(context).map((path) => resolve(path)).sort()).toEqual([join(root, 'app-a'), join(root, 'app-b')].sort());
      expect(getRootDirs({ cwd: root, settings: { next: { rootDir: [`${root}/app-*`, null] } } }).map((path) => resolve(path)).sort()).toEqual([join(root, 'app-a'), join(root, 'app-b')].sort());
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
