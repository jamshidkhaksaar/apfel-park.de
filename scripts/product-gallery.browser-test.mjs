// Isolated real-component browser regression; no Next server, APIs or live writes.
// Run with Node 24. PLAYWRIGHT_MODULE may point to a parent-provided installation.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/root/apfel-audit/browser/node_modules/playwright');
const root = new URL('../', import.meta.url).pathname;
const mode = process.argv[2] || 'focus';
assert.ok(['focus', 'bounds', 'locale'].includes(mode), 'supported test mode required');
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="white"/><rect x="100" y="30" width="200" height="340" rx="20" fill="gray"/></svg>');
const bundle = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import ProductGallery from './src/components/ProductGallery';
const params = new URLSearchParams(location.search);
const count = Number(params.get('count') ?? 3);
createRoot(document.getElementById('root')).render(<React.StrictMode><button id="outside">Outside</button><div style={{transform:params.get('motion') === 'reduce' ? 'none' : 'translateY(0)', minHeight:4800, paddingTop:80}}><div style={{maxWidth:600}}><ProductGallery locale={params.get('lang') || 'en'} title="Test phone" images={Array.from({length:count}, (_,i)=>${JSON.stringify(image)}+'#'+i)} /></div></div></React.StrictMode>);`, resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
});
const cssFile = root + 'src/app/globals.css';
const css = (await postcss([tailwind({ base: root })]).process(await readFile(cssFile, 'utf8'), { from: cssFile })).css;
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'text/javascript' : req.url === '/style.css' ? 'text/css' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : req.url === '/style.css' ? css : '<!doctype html><html lang="en"><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => { errors.push(e.message); console.error('Browser error:', e.message); });
const url = `http://127.0.0.1:${server.address().port}`;
const open = async (query = '') => {
  await page.goto(url + query);
  await page.locator('button.cursor-zoom-in').click();
  await page.getByRole('dialog').waitFor();
};
const inside = () => page.evaluate(() => !!document.querySelector('[role="dialog"],dialog')?.contains(document.activeElement));
try {
  if (mode === 'focus') {
    await open();
    assert.equal(await inside(), true, 'initial focus belongs to the dialog');
    assert.equal(await page.getByRole('button', { name: 'Close', exact: true }).evaluate(el => el === document.activeElement), true);
    await page.evaluate(() => {
      window.galleryFocusReturns = 0;
      document.querySelector('button.cursor-zoom-in').addEventListener('focus', () => window.galleryFocusReturns++);
    });
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(260);
    assert.equal(await inside(), true, 'F04: image change must not restore outside focus');
    assert.equal(await page.getByRole('button', { name: 'Close', exact: true }).evaluate(el => el === document.activeElement), true, 'arrow navigation does not reset focus');
    assert.equal(await page.getByRole('dialog').getByRole('img', { name: 'Test phone', exact: true }).getAttribute('src'), image + '#1');
    for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      assert.equal(await inside(), true, `focus stays inside on ${key}`);
    }
    await page.evaluate(() => document.querySelector('#outside').focus());
    assert.equal(await inside(), true, 'background is inert to programmatic focus');
    await page.getByRole('dialog').getByRole('button', { name: 'Next image', exact: true }).click();
    await page.waitForTimeout(260);
    assert.equal(await inside(), true, 'pointer navigation preserves modal focus');
    assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Next image', exact: true }).evaluate(el => el === document.activeElement), true, 'clicked next button retains focus');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(260);
    assert.equal(await inside(), true, 'previous image preserves modal focus');
    assert.equal(await page.evaluate(() => window.galleryFocusReturns), 0, 'no close restoration during image navigation');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await page.locator('button.cursor-zoom-in').evaluate(el => el === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.equal(await page.evaluate(() => window.galleryFocusReturns), 1, 'focus returns exactly once on close');
    await page.locator('button.cursor-zoom-in').click();
    await page.getByRole('dialog').click({ position: { x: 1, y: 1 } });
    assert.equal(await page.locator('button.cursor-zoom-in').evaluate(el => el === document.activeElement), true, 'backdrop close restores focus');
    await open('?count=1');
    await page.keyboard.press('Tab');
    assert.equal(await inside(), true, 'single-image dialog traps focus');
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
    assert.equal(await page.locator('button.cursor-zoom-in').evaluate(el => el === document.activeElement), true);
    await page.goto(url + '?count=0');
    assert.equal(await page.locator('button.cursor-zoom-in').count(), 0, 'empty gallery stays absent');
  }
  if (mode === 'bounds') {
    for (const [width, height] of [[1440,900],[820,900],[390,844],[320,568],[568,320]]) {
      for (const motion of ['no-preference','reduce']) {
        await page.setViewportSize({width,height});
        await page.emulateMedia({ reducedMotion: motion });
        await open('?motion=' + motion);
        for (const theme of ['dark', 'mono']) {
          await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
          const rect = await page.getByRole('dialog').boundingBox();
          assert.ok(rect.x >= -1 && rect.y >= -1 && rect.x + rect.width <= width + 1 && rect.y + rect.height <= height + 1, `F12: dialog bounds ${JSON.stringify(rect)} exceed ${width}x${height}`);
          for (const control of await page.getByRole('dialog').getByRole('button').all()) {
            const b = await control.boundingBox();
            assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= width && b.y + b.height <= height, 'controls remain within viewport');
          }
          const b = await page.getByRole('dialog').getByRole('img', { name: 'Test phone', exact: true }).boundingBox();
          assert.ok(b.y >= 0 && b.y+b.height <= height && b.x >= 0 && b.x+b.width <= width, 'image stage remains within viewport');
        }
        await page.setViewportSize({ width: 320, height: 320 });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const resized = await page.getByRole('dialog').boundingBox();
        assert.ok(resized.x >= 0 && resized.y >= 0 && resized.x + resized.width <= 320 && resized.y + resized.height <= 320, `open dialog follows viewport resizing: ${JSON.stringify(resized)}`);
      }
    }
  }
  if (mode === 'locale') {
    for (const lang of ['de', 'en']) {
      const de = lang === 'de';
      await page.goto(url + '?lang=' + lang);
      const opener = page.getByRole('button', { name: `${de ? 'Bildergalerie öffnen' : 'Open image gallery'}: Test phone`, exact: true });
      assert.equal(await opener.count(), 1, 'F11: localized opener describes its action');
      const thumbnail = page.getByRole('button', { name: de ? 'Bild 2 von 3' : 'Image 2 of 3', exact: true });
      assert.equal(await thumbnail.getAttribute('aria-pressed'), 'false');
      await thumbnail.click();
      await page.waitForTimeout(260);
      assert.equal(await thumbnail.getAttribute('aria-pressed'), 'true');
      await opener.click();
      const dialog = page.getByRole('dialog');
      assert.equal(await dialog.getByRole('button', { name: de ? 'Vorheriges Bild' : 'Previous image', exact: true }).count(), 1);
      await dialog.getByRole('button', { name: de ? 'Nächstes Bild' : 'Next image', exact: true }).click();
      await page.waitForTimeout(260);
      assert.equal(await dialog.getByRole('status').textContent(), de ? 'Bild 3 von 3' : 'Image 3 of 3');
      await dialog.getByRole('button', { name: de ? 'Schließen' : 'Close', exact: true }).click();
    }
  }
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log(`PASS gallery ${mode} (real React component, actual globals.css, Chromium)`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
