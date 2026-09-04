// Isolated real-component Chromium fixtures; no Next server, database or payments.
// Node 24: node scripts/public-ui-regression.mjs [F01|F05|F06|F07|F09]
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/root/apfel-audit/browser/node_modules/playwright');
const root = process.cwd();
const header = await readFile('src/components/SiteHeader.tsx', 'utf8');
const skipClass = header.match(/href="#main-content"\s+className="([^"]+)"/)[1];
const entry = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync as fixtureFlushSync} from 'react-dom';
window.fixtureFlushSync=fixtureFlushSync;
function FixtureRoute({children}) {
 const [navigated,setNavigated]=React.useState(false);
 window.fixtureNavigate=()=>{fixtureFlushSync(()=>setNavigated(true));document.getElementById('destination').focus();};
 return navigated?<main id="main-content" tabIndex={-1}><button id="destination">New route focused control</button></main>:children;
}
import ThemeProvider from './src/components/ThemeProvider';
import ThemeToggle from './src/components/ThemeToggle';
import CookieBanner from './src/components/CookieBanner';
import StoreFilters from './src/components/store/StoreFilters';
import CheckoutClient from './src/components/checkout/CheckoutClient';
const params = new URLSearchParams(location.search), kind=params.get('case'), lang=params.get('lang')||'de';
const facets={brands:[],storages:[],conditions:[],accessoryTypes:[],priceMin:0,priceMax:1000};
const filters={query:'',brands:[],storages:[],conditions:[],accessoryTypes:[],inStockOnly:false};
createRoot(document.getElementById('root')).render(<FixtureRoute><a href="#main-content" className=${JSON.stringify(skipClass)}>Skip</a><main id="main-content" tabIndex={-1} className="p-8"><button id="outside">Outside</button>{kind==='theme'?<ThemeProvider initialTheme="mono"><ThemeToggle/></ThemeProvider>:kind==='consent'?<CookieBanner lang={lang}/>:kind==='filters'?<><div className="hidden lg:block"><StoreFilters lang={lang} facets={facets} activeFilters={filters} resultCount={1}/></div><StoreFilters variant="mobile" lang={lang} facets={facets} activeFilters={filters} resultCount={1}/></>:<CheckoutClient locale={lang} initialShippingMethod="germany" couponEnabled={params.get('coupons')!=='off'}/>}<button id="after">After</button></main></FixtureRoute>);
`;
const stubs = {
  'next/navigation': `export const useRouter=()=>({push:()=>{}}); export const useSearchParams=()=>new URLSearchParams();`,
  'next/dynamic': `export default ()=>()=>null;`,
  'next/link': `import React from 'react';export default ({children,...props})=><a {...props}>{children}</a>;`,
  'next/image': `import React from 'react';export default ({fill,priority,unoptimized,...props})=><img {...props}/>;`,
};
const bundle = await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"','process.env':'{}'},jsx:'automatic',plugins:[{name:'fixture-next',setup(b){b.onResolve({filter:/^next\/(navigation|dynamic|link|image)$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:stubs[a.path],loader:'jsx',resolveDir:root}));}}]});
const css = (await postcss([tailwind({base:root})]).process(await readFile('src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'})).css;
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
const failures=[];
async function fixture(kind,theme='mono',lang='de',viewport={width:390,height:700}) {
 const page=await browser.newPage({viewport});
 await page.addInitScript(({theme})=>{document.addEventListener('DOMContentLoaded',()=>document.documentElement.setAttribute('data-theme',theme));localStorage.setItem('apfel-cart-v1',JSON.stringify([{productId:'fixture',quantity:1,variantColor:null,variantStorage:null}]));},{theme});
 await page.route('**/api/**',route=>{
  if(route.request().url().endsWith('/api/cart/validate')) return route.fulfill({json:{success:true,cart:{items:[{productId:'fixture',slug:'fixture',title:'Fixture phone',quantity:1,variantColor:null,variantStorage:null,unitAmount:100,lineAmount:100,condition:'new'}],currency:'EUR',subtotalAmount:100,shippingAmount:0,totalAmount:100,vatAmount:15.97}}});
  if(route.request().url().includes('/coupon')) return route.fulfill({status:400,json:{success:false,error:'Fixture coupon rejected'}});
  return route.abort();
 });
 page.on('pageerror',error=>failures.push(error.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?case=${kind}&lang=${lang}`);
 await page.locator('#after').waitFor();
 return page;
}
const tests={
 F09:async()=>{
  for(const theme of ['mono','dark']) for(const lang of ['de','en']) for(const size of [{width:320,height:568},{width:568,height:320}]){
   const p=await fixture('consent',theme,lang,size);const panel=p.getByRole('dialog').locator(':scope > div');await panel.waitFor();
   for(const fontSize of [16,32,64]){
    await p.evaluate(size=>document.documentElement.style.fontSize=size+'px',fontSize);
    const bounds=await panel.boundingBox();assert.ok(bounds.y>=-1&&bounds.y+bounds.height<=size.height+1,'consent panel stays within short viewport with enlarged text');
    assert.equal(await panel.evaluate(el=>getComputedStyle(el).overflowY),'auto','consent panel has internal scrolling');
    await panel.evaluate(el=>el.scrollTop=0);assert.ok(await panel.evaluate(el=>el.scrollTop===0));
    for(const control of await p.getByRole('dialog').locator('a,button').all()){
     await control.focus();const b=await control.boundingBox();assert.ok(b.y+b.height>0&&b.y<size.height,'every consent choice/link can be reached');
    }
   }
   await p.getByRole('dialog').getByRole('button').first().click();assert.equal(await p.getByRole('dialog').count(),0);assert.equal(await p.evaluate(()=>document.body.style.overflow),'');await p.close();
  }
 },
 F07:async()=>{
  for(const theme of ['mono','dark']){
   const p=await fixture('filters',theme,'de',{width:1023,height:700});
   const trigger=p.getByRole('button',{name:'Filter',exact:true});await trigger.click();await p.getByRole('dialog').waitFor();
   assert.equal(await p.evaluate(()=>document.body.style.overflow),'hidden');
   await p.setViewportSize({width:1024,height:700});
   await p.waitForTimeout(100);
   assert.equal(await p.evaluate(()=>document.body.style.overflow),'','desktop breakpoint must release body scroll lock');
   assert.equal(await p.locator('[role=dialog]').count(),0,'desktop transition unmounts mobile dialog');
   assert.equal(await p.getByRole('button',{name:'Filter',exact:true,includeHidden:true}).evaluate(el=>el.isConnected&&el.getClientRects().length===0),true,'desktop hides but does not disconnect the captured trigger');
   assert.equal(await p.evaluate(()=>document.activeElement?.matches('[data-store-desktop-filters]')&&document.activeElement.getClientRects().length>0),true,'connected hidden trigger restores focus to the visible desktop sidebar');
   await p.setViewportSize({width:1023,height:700});assert.equal(await p.locator('[role=dialog]').count(),0);
   await trigger.click();await p.keyboard.press('Escape');await p.waitForTimeout(100);
   assert.equal(await trigger.evaluate(el=>el===document.activeElement),true,'mobile Escape restores trigger');
   assert.equal(await p.evaluate(()=>document.body.style.overflow),'');
   await trigger.click();
   const reopened=await trigger.evaluate(async(button)=>{
    // Commit close and reopen in one task, before the old close frame can run.
    window.fixtureFlushSync(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
    const closedDialogs=document.querySelectorAll('[role=dialog]').length;
    window.fixtureFlushSync(()=>button.click());
    const dialog=document.querySelector('[role=dialog]');
    const initiallyInside=dialog?.contains(document.activeElement);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {closedDialogs,initiallyInside,stillInside:dialog?.contains(document.activeElement),dialogs:document.querySelectorAll('[role=dialog]').length,overflow:document.body.style.overflow};
   });
   assert.deepEqual(reopened,{closedDialogs:0,initiallyInside:true,stillInside:true,dialogs:1,overflow:'hidden'},'obsolete close must not move focus behind a reopened drawer');
   const navigation=await p.evaluate(async()=>{
    window.fixtureNavigate();
    const before=document.activeElement.id;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {before,after:document.activeElement.id,overflow:document.body.style.overflow,dialogs:document.querySelectorAll('[role=dialog]').length};
   });
   assert.deepEqual(navigation,{before:'destination',after:'destination',overflow:'',dialogs:0},'unmount must preserve new-route focus and release the drawer');
   await p.close();
  }
 },
 F06:async()=>{
  for(const theme of ['mono','dark']){
   const p=await fixture('theme',theme);const radios=p.getByRole('radio');await radios.first().waitFor();
   await p.getByRole('radio',{checked:true}).focus();
   for(const key of ['ArrowRight','ArrowRight','ArrowLeft','ArrowLeft','ArrowDown','ArrowUp']){
    const before=await p.getByRole('radio',{checked:true}).getAttribute('aria-label');await p.keyboard.press(key);
    assert.notEqual(await p.getByRole('radio',{checked:true}).getAttribute('aria-label'),before,'arrows wrap selection');
    assert.equal(await p.getByRole('radio',{checked:true}).evaluate(el=>el===document.activeElement),true,'theme arrow selection must move DOM focus');
   }
   await p.keyboard.press('Space');assert.equal(await p.getByRole('radio',{checked:true}).evaluate(el=>el===document.activeElement),true);
   await p.keyboard.press('Tab');assert.equal(await p.locator('#after').evaluate(el=>el===document.activeElement),true);await p.close();
  }
 },
 F05:async()=>{
  for(const lang of ['de','en']){
   const p=await fixture('checkout','mono',lang);const name=lang==='de'?'Gutscheincode':'Coupon code';
   await p.locator('input[type=radio]').first().waitFor();
   assert.equal(await p.getByRole('textbox',{name,exact:true}).count(),1,'coupon has an associated accessible label');
   await p.locator('label').filter({hasText:name}).click();
   assert.equal(await p.getByRole('textbox',{name,exact:true}).evaluate(el=>el===document.activeElement),true);
   await p.getByRole('textbox',{name,exact:true}).fill('INVALID');
   await p.getByRole('button',{name:lang==='de'?'Anwenden':'Apply',exact:true}).click();
   await p.getByRole('status').waitFor();
   assert.equal(await p.getByRole('textbox',{name,exact:true}).evaluate(el=>document.getElementById(el.getAttribute('aria-describedby'))?.getAttribute('role')),'status');
   await p.goto(p.url()+'&coupons=off');await p.locator('input[type=radio]').first().waitFor();assert.equal(await p.getByRole('textbox',{name,exact:true}).count(),0);await p.close();
  }
 },
 F01:async()=>{
  for(const theme of ['mono','dark']){
   const p=await fixture('checkout',theme);
   const radio=p.locator('input[type=radio]').first();await radio.waitFor();await radio.focus();
   const bounds=await radio.evaluate(el=>({position:getComputedStyle(el).position,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,ring:getComputedStyle(el.closest('label')).boxShadow}));
   assert.notEqual(bounds.position,'fixed','focused fulfillment radio must not become a fixed skip link');
   assert.ok(bounds.width<=1&&bounds.height<=1,'radio stays visually hidden');assert.notEqual(bounds.ring,'none','fulfillment card retains visible focus ring');
   const skip=p.getByRole('link',{name:'Skip',exact:true});await skip.focus();assert.equal(await skip.evaluate(el=>getComputedStyle(el).position),'fixed');
   assert.ok((await skip.boundingBox()).width>1,'skip link reveals');await p.close();
  }
 },
};
try {
 for(const [name,test] of Object.entries(tests)) if(!process.argv[2]||process.argv[2]===name){try{await test();console.log(`PASS ${name}`);}catch(error){failures.push(`${name}: ${error.message}`);console.error(`FAIL ${name}: ${error.message}`);}}
 assert.deepEqual(failures,[]);
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
