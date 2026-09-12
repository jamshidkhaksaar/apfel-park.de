// Real collection UI, synthetic inventory and intercepted APIs. No production writes.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/root/apfel-audit/browser/node_modules/playwright');
const root = new URL('../', import.meta.url).pathname;
const output = process.env.EVIDENCE_DIR || '/tmp/apfel-collection-growth';
await mkdir(output, { recursive: true });
const fixture = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import Catalog from './src/components/store/StoreCatalogClient';
import Guide from './src/components/store/CollectionBuyingGuide';
import {getStoreCollectionCopy} from './src/lib/store-collections';
import {getCollectionAnalyticsList} from './src/lib/store-collection-analytics';
import {readConsentMode,writeConsentMode} from './src/lib/consent';
import {TRACKING_READY_EVENT} from './src/lib/analytics';
import {MINI_CART_OPEN_EVENT} from './src/components/checkout/MiniCart';
const q=new URLSearchParams(location.search), id=q.get('id')||'samsung-phones', lang=q.get('lang')||'de';
const p={id:'fixture',title:'Fixture Phone',slug:'fixture-phone',image:'/fixture.svg',price:199,category:'smartphones',condition:'used',stock:q.has('sold')?0:3,facts:['128 GB'],colors:['Black','White'],storages:['128 GB','256 GB'],variants:q.has('variant')?[{color:'Black',storage:'128 GB',stock:2,price:199},{color:'White',storage:'256 GB',stock:1,price:229}]:[]};
const copy=getStoreCollectionCopy(id,lang);
window.events=[];window.miniCartOpens=0;
window.addEventListener(MINI_CART_OPEN_EVENT,()=>window.miniCartOpens++);
window.apfelTrack=(name,payload,eventId)=>{if(readConsentMode()!=='external')return false;window.events.push({name,payload,eventId});return true;};
window.grant=()=>{writeConsentMode('external');window.dispatchEvent(new Event(TRACKING_READY_EVENT));};
const r=createRoot(document.getElementById('root'));
window.renderFixture=()=>r.render(<main className="container-page"><h1>{copy.title}</h1><Catalog products={[p]} lang={lang} lockedCategory="smartphones" total={1} page={1} pages={1} counts={{all:1,smartphones:1,tablets:0,accessories:0,laptops:0,consoles:0,'open-box-smartphones-tablets':1}} facets={{brands:[],storages:[],conditions:[],accessoryTypes:[],inStock:p.stock>0?1:0,priceMin:199,priceMax:229}} activeFilters={{query:'',brands:[],storages:[],conditions:[],accessoryTypes:[],inStockOnly:false}} showSearch={false} analyticsList={getCollectionAnalyticsList(id,lang)}/>{copy.comparison?<Guide guide={copy.comparison} locale={lang}/>:null}</main>);
window.renderFixture();`;
const bundle = await build({ stdin: { contents: fixture, resolveDir: root, loader: 'tsx' }, outfile: root + 'fixture-output/entry.js', bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', minify: true, define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' }, plugins: [{ name: 'isolated-next-routing', setup(b) {
  b.onResolve({ filter: /^next\/(navigation|link|image)$/ }, a => ({ path: a.path, namespace: 'fixture' }));
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ loader: 'tsx', contents: a.path.endsWith('navigation')
    ? `export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({push:href=>{history.pushState({},'',href);window.renderFixture();}});`
    : a.path.endsWith('link') ? `import React from 'react';export default function Link({href,children,onClick,...props}){return <a {...props} href={href} onClick={e=>{onClick?.(e);e.preventDefault();window.lastLink=href;}}>{children}</a>}`
    : `import React from 'react';export default function Image({fill,priority,sizes,unoptimized,loader,...props}){return <img {...props} alt={props.alt||''} style={{width:100,height:100}}/>}`,
    resolveDir: root,
  }));
} }] });
const cssFile = root + 'src/app/globals.css';
const css = (await postcss([tailwind({ base: root })]).process(await readFile(cssFile, 'utf8'), { from: cssFile })).css;
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://fixture').pathname;
  if (path === '/entry.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js')).contents); }
  else if (path === '/style.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); }
  else if (path === '/fixture.svg') { res.setHeader('Content-Type', 'image/svg+xml'); res.end('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="25" y="5" width="50" height="90" rx="8" fill="#ddd"/></svg>'); }
  else if (path.startsWith('/api/')) { res.writeHead(400); res.end('Unmocked fixture API'); }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html data-theme="mono"><head><title>Collection growth fixture</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/entry.js"></script></body></html>'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox'] });
const results = [];
try {
  for (const id of ['samsung-phones', 'used-iphones', 'phones-without-contract', 'iphone-17']) {
    for (const lang of ['de', 'en']) {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 } });
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
        const variant = id === 'used-iphones';
        await page.goto(`${base}/${lang}/fixture?id=${id}&lang=${lang}${variant ? '&variant' : ''}${width === 1440 ? '&view=list' : ''}`);
        await page.getByRole('heading', { level: 1 }).waitFor();
        assert.equal(await page.title(), 'Collection growth fixture');
        assert.equal(await page.locator('[data-collection-buying-guide]').count(), id === 'iphone-17' ? 0 : 1);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal page overflow');
        assert.deepEqual(await page.evaluate(() => window.events), [], 'no impression before consent');
        await page.evaluate(() => window.grant());
        await page.waitForFunction(() => window.events.length === 1);
        await page.evaluate(() => { window.grant(); window.renderFixture(); });
        await page.waitForTimeout(80);
        assert.equal(await page.evaluate(() => window.events.length), 1, 'no duplicate impression on readiness or rerender');
        await page.locator('a[href$="/store/fixture-phone"]').first().click();
        const add = page.getByRole('button', { name: lang === 'de' ? 'Fixture Phone in den Warenkorb' : 'Add Fixture Phone to cart', exact: true });
        await add.click();
        if (variant) {
          const dialog = page.getByRole('dialog');
          await dialog.waitFor();
          await dialog.getByRole('radio', { name: 'White', exact: true }).check();
          await dialog.getByRole('button', { name: lang === 'de' ? 'In den Warenkorb' : 'Add to cart', exact: true }).click();
        }
        await page.waitForFunction(() => window.events.some(e => e.name === 'add_to_cart'));
        const events = await page.evaluate(() => window.events);
        assert.deepEqual(events.map(e => e.name), ['view_item_list', 'select_item', 'add_to_cart']);
        const expectedId = id === 'iphone-17' ? 'store-catalog' : id;
        for (const event of events) {
          assert.equal(event.payload.item_list_id, expectedId);
          assert.equal(event.payload.items[0].item_list_id, expectedId);
          assert.equal(event.payload.items[0].item_list_name, event.payload.item_list_name);
          assert.equal(event.payload.items[0].index, 1);
        }
        const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('apfel-cart-v1')));
        assert.equal(cart[0].quantity, 1);
        if (variant) { assert.equal(cart[0].variantColor, 'White'); assert.equal(cart[0].variantStorage, '256 GB'); assert.equal(events[2].payload.items[0].price, 229); }
        assert.equal(await page.evaluate(() => window.miniCartOpens), 1);
        if (id === 'samsung-phones' && lang === 'de') {
          await page.getByRole('link', { name: 'Nach Galaxy-A55-Angeboten suchen', exact: true }).click();
          assert.equal(await page.evaluate(() => window.lastLink), '/de/samsung-handys?q=Galaxy%20A55#angebote');
          await page.locator('[data-collection-buying-guide]').screenshot({ path: `${output}/samsung-guide-${width}.png` });
        }
        assert.deepEqual(errors, []);
        results.push({ id, lang, width, view: width === 1440 ? 'list' : 'grid', result: 'pass', events: events.map(e => e.name) });
        await context.close();
      }
    }
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${base}/de/fixture?sold`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  const buy = page.getByRole('button', { name: 'Fixture Phone in den Warenkorb', exact: true });
  assert.equal(await buy.isDisabled(), true);
  assert.ok(await page.locator('a[href$="/store/fixture-phone"]').count());
  assert.equal(await page.evaluate(() => localStorage.getItem('apfel-cart-v1')), null);
  results.push({ scenario: 'out-of-stock remains linked and cannot be bought', result: 'pass' });
  await context.close();
  await writeFile(`${output}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ passed: results.length, output }));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
