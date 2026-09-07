// Exercise the production optimizer with files created AFTER server startup.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const uploads = await mkdtemp(path.join(os.tmpdir(), 'apfel-image-regression-'));
const portProbe = createServer();
await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
const port = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['.next/standalone/server.js'], {
  env: { ...process.env, PORT: String(port), HOSTNAME: '127.0.0.1', UPLOADS_DIR: uploads, INTERNAL_APP_URL: base },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', chunk => { logs += chunk; });
server.stderr.on('data', chunk => { logs += chunk; });
const stopped = once(server, 'exit');
const request = url => fetch(base + url, { signal: AbortSignal.timeout(10000) });

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      if ((await request('/uploads/products/not-created.webp')).status === 404) {
        ready = true;
        break;
      }
    } catch { /* Wait for the isolated server to listen. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `standalone server failed to start: ${logs}`);
  await mkdir(path.join(uploads, 'products'));
  for (const format of ['webp', 'png', 'jpeg']) {
    const url = `/uploads/products/fresh.${format}`;
    assert.equal((await request(url)).status, 404);
    const input = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#aabbcc' } })
      .toFormat(format).toBuffer();
    await writeFile(path.join(uploads, 'products', `fresh.${format}`), input);
    assert.equal((await request(url)).status, 200);
    for (const width of [64, 256, 640, 1920]) {
      const response = await request(`/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`);
      assert.equal(response.status, 200, `${format} at width ${width}: ${await (response.status === 200 ? Promise.resolve('') : response.text())}`);
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
      assert.equal(metadata.width, Math.min(width, 800));
    }
  }
  console.log('PASS: post-startup WebP, PNG and JPEG uploads optimize at 64, 256, 640 and 1920px without restart.');
} finally {
  server.kill('SIGTERM');
  await stopped;
  await rm(uploads, { recursive: true, force: true });
}
