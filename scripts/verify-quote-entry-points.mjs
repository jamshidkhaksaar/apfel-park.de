// Read-only UI regression: no quote submissions or business-data mutations.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-sandbox'] });
const results = [];
const output = process.env.QA_OUTPUT || '/tmp/quote-entry-qa';
await mkdir(output, { recursive: true });
try {
  for (const width of [320, 390, 768, 1024, 1280, 1440, 1536]) for (const locale of ['de', 'en']) for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['', '/smartphones']) {
      await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:3095'}/${locale}${route}`, { waitUntil: 'networkidle' });
      const cookie = page.getByRole('button', { name: locale === 'de' ? 'Nur notwendige' : 'Necessary only', exact: true });
      if (!route) await cookie.waitFor({ state: 'visible' });
      if (await cookie.isVisible()) await cookie.click();
      await page.evaluate(theme => document.documentElement.dataset.theme = theme === 'light' ? 'mono' : 'dark', theme);
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme === 'light' ? 'mono' : 'dark');
      const controls = await page.locator('.navbar-shell a, .navbar-shell button').evaluateAll(elements => elements
        .filter(e => !e.closest('dialog') && e.getBoundingClientRect().width > 0)
        .map(e => ({ name: e.textContent || e.getAttribute('aria-label'), rect: e.getBoundingClientRect().toJSON() })));
      for (const control of controls) {
        assert.ok(control.rect.x >= 0 && control.rect.right <= width, `header control clipped: ${JSON.stringify(control)}`);
      }
      for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i].rect, b = controls[j].rect;
        assert.ok(!(a.x < b.right - 1 && a.right > b.x + 1 && a.y < b.bottom - 1 && a.bottom > b.y + 1), `overlapping header controls: ${controls[i].name} / ${controls[j].name}`);
      }
      const mobileControls = page.locator('.navbar-shell a.xl\\:hidden, button[aria-controls="mobile-menu-nav"]');
      for (const control of await mobileControls.all()) if (await control.isVisible()) {
        const bounds = await control.boundingBox();
        assert.ok(bounds.width >= 44 && bounds.height >= 44, 'mobile cart/menu target shrunk');
      }
      const headerTrigger = page.locator('header button[aria-haspopup="dialog"]');
      assert.equal(await headerTrigger.count(), 1, 'visible navbar quote button missing');
      const triggers = [headerTrigger];
      if (route) triggers.push(page.locator('main section button[aria-haspopup="dialog"]'));
      for (const trigger of triggers) {
        assert.equal(await trigger.count(), 1);
        await trigger.scrollIntoViewIfNeeded();
        const box = await trigger.boundingBox();
        assert.ok(box && box.x >= 0 && box.x + box.width <= width && box.height >= 44, 'button clipped or too small');
        const id = await trigger.getAttribute('aria-controls');
        const dialog = page.locator(`[id="${id}"]`);
        assert.equal(await dialog.count(), 1);
        assert.equal(await dialog.isVisible(), false);
        await trigger.click();
        await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.isVisible(), true);
        assert.ok(await dialog.evaluate(e => e.contains(document.activeElement)));
        const bounds = await dialog.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 901);
        await dialog.locator('[name="model"]').fill('Read-only UI check');
        await dialog.locator('summary').click();
        assert.equal(await dialog.locator('[name="storage"]').isVisible(), true);
        await dialog.locator('button[type="submit"]').focus();
        await page.keyboard.press('Tab');
        assert.ok(await dialog.evaluate(e => e.contains(document.activeElement)), 'focus escaped');
        await page.keyboard.press('Escape');
        assert.equal(await dialog.isVisible(), false);
        assert.ok(await trigger.evaluate(e => e === document.activeElement));
        await trigger.click();
        assert.equal(await dialog.locator('[name="model"]').inputValue(), 'Read-only UI check');
        await dialog.getByRole('button', { name: locale === 'de' ? 'Schließen' : 'Close', exact: true }).click();
        assert.ok(await trigger.evaluate(e => e === document.activeElement));
      }
      const ids = await page.locator('[id]').evaluateAll(elements => elements.map(e => e.id));
      assert.equal(new Set(ids).size, ids.length, 'duplicate IDs');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'horizontal overflow');
      const menu = page.locator('button[aria-controls="mobile-menu-nav"]');
      if (await menu.isVisible()) {
        await menu.click();
        const nav = page.locator('#mobile-menu-nav');
        assert.equal(await nav.getAttribute('aria-hidden'), 'false');
        await nav.locator('a').last().scrollIntoViewIfNeeded();
        await page.keyboard.press('Escape');
        assert.equal(await nav.getAttribute('aria-hidden'), 'true');
        assert.ok(await menu.evaluate(e => e === document.activeElement));
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/${width}-${locale}-${theme}-${route ? 'smartphones' : 'home'}.png` });
      assert.deepEqual(errors, []);
      results.push({ width, locale, theme, route: `/${locale}${route}`, passed: true });
      await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
    }
    await page.close();
  }
  console.log(JSON.stringify({ passed: results.length, output }));
} finally { await browser.close(); }
