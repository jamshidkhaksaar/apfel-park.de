// Isolated real storefront components; synthetic products, no production APIs.
// Node 24; optional PLAYWRIGHT_MODULE. Uses real Next Image/React and project CSS.
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
const imageMetadata = await sharp(root+'public/images/ipad.png').metadata();
const portraitRatio = imageMetadata.width / imageMetadata.height;
const bundle = await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Image from 'next/image';import Card from './src/components/store/StoreProductCard';import Row from './src/components/store/StoreProductRow';import Gallery from './src/components/ProductGallery';
const q=new URLSearchParams(location.search), lang=q.get('lang')||'de', C=q.get('view')==='row'?Row:Card;
const p=${JSON.stringify(product)};
const homeSizes=q.has('before')?'(max-width: 1024px) 100vw, 50vw':${JSON.stringify(homeSizes)};
createRoot(document.getElementById('root')).render(q.has('image')?<div className="container-page"><div className="grid gap-12 lg:grid-cols-2"><div/><div className="relative aspect-[4/3] w-full lg:aspect-square"><div className="absolute inset-0 p-1"><div className="relative h-full w-full border"><div className="absolute inset-0 pt-10 pb-12"><Image src="/images/ipad.png" alt="Repair fixture" fill sizes={homeSizes} className="object-contain p-4"/></div></div></div></div></div></div>:q.has('gallery')?<Gallery locale={lang} title="Fixture Phone" images={['/images/ipad.png','/images/shop2.jpg']}/>:<div style={{maxWidth:q.get('view')==='row'?1000:360,margin:'auto'}}><C product={q.has('sold')?{...p,stock:0,variants:[]}:q.has('single')?{...p,variants:[p.variants[0]]}:p} locale={lang} listName="Fixture" position={1}/></div>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,outdir:root+'fixture-output',entryNames:'entry',chunkNames:'[name]-[hash]',format:'esm',splitting:true,platform:'browser',jsx:'automatic',minify:true,metafile:true,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'}});
const files=new Map(bundle.outputFiles.map(f=>['/'+f.path.split('/').at(-1),f.contents]));
const drawerChunks=Object.entries(bundle.metafile.outputs).filter(([p,o])=>!p.endsWith('/entry.js') && Object.keys(o.inputs).some(i=>i.endsWith('/StoreQuickAddDrawer.tsx'))).map(([p])=>'/'+p.split('/').at(-1));
assert.equal(drawerChunks.length,0,'drawer is statically available without an interaction-time chunk');
const cssFile=root+'src/app/globals.css';
const css=(await postcss([tailwind({base:root})]).process(await readFile(cssFile,'utf8'),{from:cssFile})).css;
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://fixture');if(files.has(u.pathname)){res.setHeader('Content-Type','text/javascript');res.end(files.get(u.pathname));}else if(u.pathname==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);}else if(u.pathname==='/_next/image'){assert.ok(['/images/ipad.png','/images/shop2.jpg'].includes(u.searchParams.get('url')));const buf=await sharp(root+'public'+u.searchParams.get('url')).resize({width:Number(u.searchParams.get('w')),withoutEnlargement:true}).webp({quality:75}).toBuffer();res.setHeader('Content-Type','image/webp');res.end(buf);}else if(u.pathname.startsWith('/api/')){res.writeHead(400);res.end('Unhandled fixture API');}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html data-theme="'+(u.searchParams.get('theme')||'mono')+'"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>');}}catch(e){res.writeHead(500);res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const rows=[];
try{
 for(const view of ['card','row'])for(const lang of ['de','en'])for(const theme of ['mono','dark'])for(const width of [320,390,820]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],scripts=[];let marketing;
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.resourceType()==='script')scripts.push(new URL(r.url()).pathname);});
  await page.route('**/api/**',route=>{if(route.request().url().endsWith('/api/marketing/add-to-cart')){marketing=route.request().postDataJSON();return route.fulfill({json:{ok:true}});}return route.abort();});
  await page.goto(`${url}/?view=${view}&lang=${lang}&theme=${theme}`);const add=page.getByRole('button',{name:lang==='de'?'Fixture Phone in den Warenkorb':'Add Fixture Phone to cart',exact:true});await add.waitFor();
  assert.equal(await page.getByRole('dialog').count(),0,'closed drawer is not mounted');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no overflow');
  await add.click();const dialog=page.getByRole('dialog');await dialog.waitFor();assert.equal(scripts.some(s=>drawerChunks.includes(s)),false,'no interaction-time drawer chunk');
  const close=dialog.getByRole('button',{name:lang==='de'?'Schließen':'Close',exact:true});assert.equal(await close.evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Shift+Tab');assert.equal(await dialog.getByRole('button',{name:lang==='de'?'In den Warenkorb':'Add to cart',exact:true}).evaluate(e=>e===document.activeElement),true,'backward Tab stays in drawer');await page.keyboard.press('Tab');assert.equal(await close.evaluate(e=>e===document.activeElement),true,'forward Tab wraps');
  await dialog.getByRole('radio',{name:'Black',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await dialog.getByRole('radio',{name:'White',exact:true}).isChecked(),true,'native radio arrow navigation');assert.equal(await dialog.getByRole('radio',{name:'256 GB',exact:true}).isChecked(),true);assert.match(await dialog.textContent(),/229/);
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});await page.waitForTimeout(40);assert.equal(await add.evaluate(e=>e===document.activeElement),true);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
  await add.click();await dialog.waitFor();assert.equal(await dialog.getByRole('radio',{name:'Black',exact:true}).isChecked(),true,'reopen resets variant');
  await dialog.getByRole('radio',{name:'White',exact:true}).check();await dialog.getByRole('button',{name:lang==='de'?'In den Warenkorb':'Add to cart',exact:true}).click();await dialog.waitFor({state:'detached'});
  const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('apfel-cart-v1')));assert.deepEqual(cart,[{productId:'fixture',variantColor:'White',variantStorage:'256 GB',quantity:1}]);await page.waitForTimeout(40);assert.equal(marketing.price,229);assert.equal(marketing.variantStorage,'256 GB');assert.deepEqual(errors,[]);
  rows.push({view,lang,theme,width,result:'pass',drawerLoading:'static import, conditional mount'});await context.close();
 }
 for(const state of ['sold','single']){
  const page=await browser.newPage();await page.route('**/api/**',route=>route.fulfill({json:{ok:true}}));await page.goto(url+'/?'+state);const add=page.getByRole('button',{name:'Fixture Phone in den Warenkorb',exact:true});await add.waitFor();
  if(state==='sold')assert.equal(await add.isDisabled(),true);else{await add.click();assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('apfel-cart-v1'))[0].variantColor),'Black');}rows.push({state,result:'pass'});await page.close();
 }
 const imageRows=[];
 for(const width of [320,390,412,820,1024,1440,1920])for(const before of [true,false]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1.75}),page=await context.newPage();await page.goto(url+'/?image'+(before?'&before':''));const image=page.getByRole('img');await image.scrollIntoViewIfNeeded();await image.evaluate(e=>e.decode());
  const row=await image.evaluate((e,ratio)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);const paintedWidth=Math.min(r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),(r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom))*ratio);return {width:innerWidth,before:new URLSearchParams(location.search).has('before'),selectedWidth:Number(new URL(e.currentSrc).searchParams.get('w')),paintedWidth,bytes:performance.getEntriesByName(e.currentSrc)[0]?.encodedBodySize,src:e.currentSrc};},portraitRatio);assert.ok(row.selectedWidth>=row.paintedWidth*1.75,'full DPR fidelity');imageRows.push(row);await context.close();
 }
 for(const width of [390,412]){const pair=imageRows.filter(r=>r.width===width);assert.ok(pair[1].bytes<pair[0].bytes,'smaller mobile encoded payload');}
 console.log(JSON.stringify({cases:rows.length,drawerChunks,imageRows},null,2));
 if(process.env.EVIDENCE_PATH)await writeFile(process.env.EVIDENCE_PATH,JSON.stringify({rows,imageRows,drawerChunks},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
