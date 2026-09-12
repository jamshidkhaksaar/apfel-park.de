import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it.skipIf(process.platform === 'win32')('retains old assets after a release is removed and never overwrites existing hashes', () => {
  const root = mkdtempSync(join(tmpdir(), 'apfel-static-retention-'));
  try {
    const old = join(root, 'old');
    const next = join(root, 'next');
    const cache = join(root, 'cache');
    mkdirSync(join(old, 'chunks'), { recursive: true });
    mkdirSync(join(next, 'chunks'), { recursive: true });
    writeFileSync(join(old, 'chunks', 'old.css'), 'body{color:black}');
    writeFileSync(join(next, 'chunks', 'new.js'), 'console.log("new")');
    writeFileSync(join(next, 'chunks', 'old.css'), 'unexpected collision');
    const run = (...sources: string[]) => {
      const result = spawnSync('bash', ['deployment/vps/scripts/preserve-static-assets.sh', cache, ...sources], { encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(0);
    };
    run(old);
    renameSync(old, join(root, 'removed-release'));
    run(next);
    expect(readFileSync(join(cache, 'chunks', 'old.css'), 'utf8')).toBe('body{color:black}');
    expect(readFileSync(join(cache, 'chunks', 'new.js'), 'utf8')).toBe('console.log("new")');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
