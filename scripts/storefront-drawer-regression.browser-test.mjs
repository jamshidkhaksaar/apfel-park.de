// Isolated real storefront components; synthetic products, no production APIs.
// Node 24; optional PLAYWRIGHT_MODULE. Real React, drawer and CSS; no app server.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import sharp from 'sharp';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/root/apfel-audit/browser/node_modules/playwright');
const root = new URL('../', import.meta.url).pathname;
const product = { id: 'fixture', title: 'Fixture Phone', slug: 'fixture-phone', image: '/images/ipad.png', price: 199, category: 'smartphones', condition: 'used', stock: 3, facts: ['128 GB'], colors: ['Black','White'], storages: ['128 GB','256 GB'], variants: [{color:'Black',storage:'128 GB',stock:2,price:199},{color:'White',storage:'256 GB',stock:1,price:229}] };
const homepage = await readFile(root+'src/app/(site)/[lang]/page.tsx','utf8');
const homeSizes = homepage.match(/src="\/images\/ipad.png"[\s\S]*?sizes="([^"]+)"/)[1];


const bundle = await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Image from 'next/image';import Card from './src/components/store/StoreProductCard';import Row from './src/components/store/StoreProductRow';import Gallery from './src/components/ProductGallery';
const q=new URLSearchParams(location.search), lang=q.get('lang')||'de', C=q.get('view')==='row'?Row:Card;
const p=${JSON.stringify(product)};
const homeSizes=q.has('before')?'(max-width: 1024px) 100vw, 50vw':${JSON.stringify(homeSizes)};
createRoot(document.getElementById('root')).render(q.has('image')?<div className="container-page"><div className="grid gap-12 lg:grid-cols-2"><div/><div className="relative aspect-[4/3] w-full lg:aspect-square"><div className="absolute inset-0 p-1"><div className="relative h-full w-full border"><div className="absolute inset-0 pt-10 pb-12"><Image src="/images/ipad.png" alt="Repair fixture" fill sizes={homeSizes} className="object-contain p-4"/></div></div></div></div></div></div>:q.has('gallery')?<Gallery locale={lang} title="Fixture Phone" images={['/images/ipad.png','/images/shop2.jpg']}/>:<div style={{maxWidth:q.get('view')==='row'?1000:360,margin:'auto'}}><C product={q.has('sold')?{...p,stock:0,variants:[]}:q.has('single')?{...p,variants:[p.variants[0]]}:p} locale={lang} listName="Fixture" position={1}/>{q.has('double')?<C product={{...p,id:'fixture2',title:'Other Phone'}} locale={lang} listName="Fixture" position={2}/>:null}</div>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,outdir:root+'fixture-output',entryNames:'entry',chunkNames:'[name]-[hash]',format:'esm',splitting:true,platform:'browser',jsx:'automatic',minify:true,metafile:true,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'}});
const files=new Map(bundle.outputFiles.map(f=>['/'+f.path.split('/').at(-1),f.contents]));
const drawerChunks=Object.entries(bundle.metafile.outputs).filter(([p,o])=>!p.endsWith('/entry.js') && Object.keys(o.inputs).some(i=>i.endsWith('/StoreQuickAddDrawer.tsx'))).map(([p])=>'/'+p.split('/').at(-1));
// Only deferred drawer outputs are fault-injected; never block the initial entry.
const cssFile=root+'src/app/globals.css';
const css=(await postcss([tailwind({base:root})]).process(await readFile(cssFile,'utf8'),{from:cssFile})).css;
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://fixture');if(files.has(u.pathname)){res.setHeader('Content-Type','text/javascript');res.end(files.get(u.pathname));}else if(u.pathname==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);}else if(u.pathname==='/_next/image'){assert.ok(['/images/ipad.png','/images/shop2.jpg'].includes(u.searchParams.get('url')));const buf=await sharp(root+'public'+u.searchParams.get('url')).resize({width:Number(u.searchParams.get('w')),withoutEnlargement:true}).webp({quality:75}).toBuffer();res.setHeader('Content-Type','image/webp');res.end(buf);}else if(u.pathname.startsWith('/api/')){res.writeHead(400);res.end('Unhandled fixture API');}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html data-theme="'+(u.searchParams.get('theme')||'mono')+'"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>');}}catch(e){res.writeHead(500);res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const observations=[];
try {
 for (const view of ['card', 'row']) {
  for (const mode of ['failure', 'delayed-escape', 'delayed-double']) {
   const context = await browser.newContext({viewport: {width: 390, height: 1400}});
   const page = await context.newPage(), errors = [];
   page.on('pageerror', error => errors.push(error.message));
   let release;
   const gate = new Promise(resolve => { release = resolve; });
   let requested = 0;
   await page.route('**/*', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/')) return route.abort();
    if (!drawerChunks.includes(path)) return route.continue();
    requested++;
    if (mode === 'failure') return route.abort('failed');
    await gate;
    return route.continue();
   });
   try {
    await page.goto(`${url}/?view=${view}&double`);
    const add = page.getByRole('button', {name: 'Fixture Phone in den Warenkorb', exact: true});
    const other = page.getByRole('button', {name: 'Other Phone in den Warenkorb', exact: true});
    const target = await other.boundingBox();
    await add.click();
    await page.waitForTimeout(100);
    if (mode === 'failure') {
     await page.waitForTimeout(400);
     assert.deepEqual(errors, [], 'chunk failure must not unmount the storefront');
     assert.equal(await page.locator('#root article').count(), 2, 'storefront remains present');
     assert.equal(await page.getByRole('dialog').count(), 1, 'options are immediately usable');
     await page.keyboard.press('Escape');
    } else if (mode === 'delayed-escape') {
     await page.keyboard.press('Escape');
     // Let normal focus restoration settle, then move away before any late resolution.
     await page.waitForTimeout(50);
     await page.keyboard.press('Tab');
     const focusBefore = await page.evaluate(() => document.activeElement?.outerHTML);
     release();
     await page.waitForTimeout(500);
     assert.equal(await page.getByRole('dialog').count(), 0, 'Escape cancels options before late chunk resolution');
     assert.equal(await page.evaluate(() => document.activeElement?.outerHTML), focusBefore, 'no late focus stealing');
    } else {
     // Real pointer at the second trigger: a mounted overlay must intercept it.
     // Do not use force/DOM click, which bypasses the user-visible modal boundary.
     await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
     release();
     await page.waitForTimeout(500);
     assert.ok(await page.getByRole('dialog').count() <= 1, 'no simultaneous drawers from two quick-add clicks');
     await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(100);
    assert.equal(await page.getByRole('dialog').count(), 0, 'drawer closes');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '', 'no leaked body lock');
    assert.deepEqual(errors, []);
    assert.equal(await page.locator('#root article').count(), 2, 'no blank tree');
    // Reopen proves dismissal has not left an unusable storefront.
    await add.click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    assert.equal(await add.evaluate(element => element === document.activeElement), true, 'focus restored to trigger');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    observations.push({view, mode, result: 'pass', deferredRequests: requested});
   } catch (error) {
    observations.push({view, mode, result: 'fail', message: error.message, errors,
     dialogs: await page.getByRole('dialog').count(),
     bodyOverflow: await page.evaluate(() => document.body.style.overflow)});
   } finally {
    release();
    await context.close();
   }
  }
 }
 console.log(JSON.stringify(observations, null, 2));
 if (process.env.EVIDENCE_PATH) await writeFile(process.env.EVIDENCE_PATH, JSON.stringify(observations, null, 2));
 assert.equal(observations.length, 6);
 assert.equal(observations.filter(row => row.result === 'fail').length, 0, 'all drawer race regressions pass');
} finally {
 await browser.close();
 await new Promise(resolve => server.close(resolve));
}
