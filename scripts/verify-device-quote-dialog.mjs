// Read-only browser check: never submits a quote or sends email.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-sandbox'] });
  const results = [];
  try {
    for (const width of [390, 1440]) for (const theme of ['light', 'dark']) for (const locale of ['de', 'en']) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const path = locale === 'de' ? 'samsung-handys' : 'xiaomi-redmi-handys';
      await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:3094'}/${locale}/${path}`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: locale === 'de' ? 'Nur notwendige' : 'Necessary only', exact: true }).click();
      await page.evaluate(theme => document.documentElement.dataset.theme = theme === 'light' ? 'mono' : 'dark', theme);
      const dialog = page.locator('main dialog[id^="device-quote-dialog-"]');
      const trigger = page.locator('main button[aria-haspopup="dialog"]');
      assert.equal(await dialog.isVisible(), false);
      const height = await page.locator('section[aria-labelledby^="device-quote-heading-"]').evaluate(e => e.getBoundingClientRect().height);
      assert.ok(height < 240, `CTA too tall: ${height}`);
      await trigger.click();
      assert.equal(await dialog.isVisible(), true);
      assert.ok(await dialog.evaluate(e => e.contains(document.activeElement)));
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 901);
      await dialog.locator('[name="model"]').fill('Dialog verification');
      await dialog.locator('summary').click();
      assert.equal(await dialog.locator('[name="storage"]').isVisible(), true);
      await dialog.locator('[name="storage"]').fill('256 GB');
      await dialog.locator('button[type="submit"]').focus();
      await page.keyboard.press('Tab');
      assert.ok(await dialog.evaluate(e => e.contains(document.activeElement)), 'focus escaped');
      await page.keyboard.press('Escape');
      assert.equal(await dialog.isVisible(), false);
      assert.ok(await trigger.evaluate(e => e === document.activeElement));
      await trigger.click();
      assert.equal(await dialog.locator('[name="model"]').inputValue(), 'Dialog verification');
      await dialog.getByRole('button', { name: locale === 'de' ? 'Schließen' : 'Close', exact: true }).click();
      assert.equal(await dialog.isVisible(), false);
      assert.ok(await trigger.evaluate(e => e === document.activeElement));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      results.push({ width, theme, locale, path, ctaHeight: height, passed: true });
      await page.close();
    }
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
