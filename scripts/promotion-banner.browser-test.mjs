// Actual React components, synthetic campaigns/cart, no production requests.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'/root/apfel-audit/browser/node_modules/playwright');
const root=new URL('../',import.meta.url).pathname,output=process.env.EVIDENCE_DIR||'/tmp/apfel-promotion-qa';
await mkdir(output,{recursive:true});
const campaign={id:'11111111-1111-4111-8111-111111111111',code:'MONTAG10',discount_type:'percent',discount_value:10,minimum_order:0,eligible_categories:['smartphones','tablets','laptops'],eligible_product_ids:[],starts_at:null,ends_at:new Date(Date.now()+7200_000).toISOString(),maximum_redemptions:100,redemption_count:0,is_active:true};
const promotion={id:campaign.id,code:campaign.code,discountType:'percent',discountValue:10,minimumOrder:0,startsAt:null,endsAt:campaign.ends_at,headline:{de:'',en:''},categories:campaign.eligible_categories,includesSelected:false,selectedOnly:false,expiresInSeconds:7200};
const fixture=`import React from 'react';import {createRoot} from 'react-dom/client';
import Banner from './src/components/promotion/PromotionBanner';import Admin from './src/components/admin/AdminPromotionBanner';import Campaign from './src/components/admin/AdminCampaignManager';import Cart from './src/components/checkout/CartClient';import Checkout from './src/components/checkout/CheckoutClient';
const q=new URLSearchParams(location.search),locale=q.get('lang')||'de',view=q.get('view')||'banner';
const promotion=${JSON.stringify(promotion)};
if(q.has('expiry')){promotion.expiresInSeconds=2;promotion.endsAt=new Date(Date.now()+2000).toISOString();}
if(q.has('permanent'))promotion.endsAt=null;
if(q.has('mixed')){promotion.categories=['smartphones','accessories'];promotion.categoryWide=['smartphones'];promotion.selectedProductIds=['fixture-phone'];promotion.includesSelected=true;}
if(q.has('accessories')){promotion.categories=['accessories'];promotion.code='DIENSTAG20';promotion.discountValue=20;}
window.copied='';Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}},configurable:true});
createRoot(document.getElementById('root')).render(<main className="container-page py-6">{view==='admin'?<Admin locale={locale}/>:view==='campaign'?<Campaign locale={locale}/>:view==='cart'?<Cart locale={locale}/>:view==='checkout'?<Checkout locale={locale} initialShippingMethod="pickup" initialCoupon="MONTAG10" couponEnabled={true}/>:<Banner promotion={promotion} locale={locale}/>}</main>);`;
const bundle=await build({stdin:{contents:fixture,resolveDir:root,loader:'tsx'},outfile:root+'fixture-output/entry.js',bundle:true,write:false,format:'iife',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'next-fixture',setup(b){
  b.onResolve({filter:/^next\/(image|link)$/},a=>({path:a.path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},a=>({resolveDir:root,loader:'tsx',contents:a.path.endsWith('link')?`import React from 'react';export default function Link({children,...p}){return <a {...p}>{children}</a>}`:`import React from 'react';export default function Image({fill,unoptimized,priority,...p}){return <img {...p} alt={p.alt||''}/>} `}));
}}]});
const cssPath=root+'src/app/globals.css';
const css=(await postcss([tailwind({base:root})]).process(await readFile(cssPath,'utf8'),{from:cssPath})).css+'\n'+bundle.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n');
const server=createServer((req,res)=>{const path=new URL(req.url,'http://fixture').pathname;
  if(path==='/entry.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles.find(f=>f.path.endsWith('.js')).contents);}
  else if(path==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);}
  else if(path.startsWith('/api/')){res.writeHead(500);res.end('Unmocked fixture API');}
  else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html data-theme="mono"><head><title>Promotion fixture</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/entry.js"></script></body></html>');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'/root/.cache/puppeteer/chrome/linux-152.0.7977.75/chrome-linux64/chrome',args:['--no-sandbox']});
const results=[];
async function pageFor(view,lang='de',width=390,extra=''){
  const context=await browser.newContext({viewport:{width,height:1000},timezoneId:'Asia/Kabul'}),page=await context.newPage(),calls=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('apfel-cart-v1',JSON.stringify([{productId:'fixture-phone',variantColor:null,variantStorage:null,quantity:1}])));
  await page.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname,body=req.postDataJSON();calls.push({path,method:req.method(),body});
    if(path==='/api/store/promotion')return route.fulfill({json:{promotion:extra.includes('mixed')?{...promotion,categories:['smartphones','accessories'],categoryWide:['smartphones'],selectedProductIds:[extra.includes('unselected')?'another-case':'fixture-phone'],includesSelected:true}:promotion}});
    if(path==='/api/admin/promotion-banner')return route.fulfill({json:{success:true,settings:req.method()==='PUT'?body:{enabled:false,campaignId:campaign.id,headline:{de:'',en:''}}}});
    if(path==='/api/admin/campaigns')return route.fulfill({json:{success:true,campaigns:[campaign],products:[],id:campaign.id}});
    if(path==='/api/cart/validate'){
      const qty=body.items[0]?.quantity||1,total=qty*100;
      return route.fulfill({json:{success:true,suggestions:[],cart:{currency:'EUR',subtotalAmount:total,subtotalAmountCents:total*100,totalAmount:total,totalAmountCents:total*100,shippingAmount:0,shippingAmountCents:0,vatAmount:15.97*qty,vatAmountCents:1597*qty,vatRate:.19,items:[{key:'fixture',productId:'fixture-phone',title:'Fixture Phone',slug:'fixture-phone',category:extra.includes('mixed')?'accessories':'smartphones',condition:'new',quantity:qty,variantColor:null,variantStorage:null,unitAmount:100,unitAmountCents:10000,lineAmount:total,lineAmountCents:total*100,stock:5}]}}});
    }
    if(path==='/api/coupons/validate')return route.fulfill({json:{success:true,code:'MONTAG10',discountAmountCents:1000,previewTotalAmountCents:9000,previewVatAmountCents:1437}});
    return route.fulfill({status:400,json:{error:'Unexpected fixture API'}});
  });
  await page.goto(`${base}/?view=${view}&lang=${lang}${extra}`);return {page,context,calls,errors};
}
try{
  for(const lang of ['de','en'])for(const width of [320,390,768,1024,1440]){
    const {page,context,errors}=await pageFor('banner',lang,width);
    await page.locator('[data-promotion-banner]').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'responsive banner');
    const button=page.getByRole('button',{name:/MONTAG10/});await button.click();
    assert.equal(await page.evaluate(()=>window.copied),'MONTAG10');
    await page.getByText(lang==='de'?'Bedingungen':'Terms',{exact:true}).click();
    assert.match(await page.locator('details').innerText(),lang==='de'?/Zubehör und Reparaturen/:/Accessories and repairs/);
    assert.ok(await page.getByRole('button',{name:/MONTAG10/}).evaluate(e=>e.getBoundingClientRect().height)>=44);
    if(lang==='de'&&(width===390||width===1440))await page.screenshot({path:`${output}/banner-${width}.png`});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('[data-promotion-banner]').evaluate(e=>getComputedStyle(e).animationName),'none');
    assert.deepEqual(errors,[]);results.push({view:'banner',lang,width,pass:true});await context.close();
  }
  {
    const {page,context}=await pageFor('banner','de',390,'&expiry');await page.locator('[data-promotion-banner]').waitFor();
    await page.locator('[data-promotion-banner]').waitFor({state:'detached',timeout:6000});results.push({view:'expiry hides banner',pass:true});await context.close();
  }
  {
    const {page,context,errors}=await pageFor('banner','de',390,'&accessories');await page.locator('[data-promotion-banner]').waitFor();
    assert.match(await page.getByRole('link').first().getAttribute('href')||'',/\/de\/store\?category=accessories/);
    await page.getByText('Bedingungen',{exact:true}).click();
    assert.match(await page.locator('details').innerText(),/Geräte und Reparaturen/);
    assert.deepEqual(errors,[]);results.push({view:'accessory campaign shows with accessory CTA',pass:true});await context.close();
  }
  for(const lang of ['de','en']){
    const {page,context,calls,errors}=await pageFor('admin',lang,390);
    await page.getByRole('button',{name:lang==='de'?'Banner speichern':'Save banner',exact:true}).waitFor();
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:lang==='de'?'Banner speichern':'Save banner',exact:true}).click();
    await page.getByRole('status').filter({hasText:lang==='de'?'gespeichert':'saved'}).waitFor();
    assert.ok(calls.some(c=>c.path==='/api/admin/promotion-banner'&&c.body?.enabled===true&&c.body.campaignId===campaign.id));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
    if(lang==='de')await page.screenshot({path:`${output}/admin-390.png`,fullPage:true});results.push({view:'admin save',lang,pass:true});await context.close();
  }
  {
    const {page,context,calls}=await pageFor('campaign');await page.getByRole('button',{name:'Neue Kampagne',exact:true}).click();
    await page.getByLabel('Gutscheincode',{exact:true}).fill('TEST10');await page.getByLabel('Start (Hamburg)',{exact:true}).fill('2026-09-14T10:00');await page.getByLabel('Ende (Hamburg)',{exact:true}).fill('2026-09-14T09:00');
    await page.getByRole('button',{name:'Speichern',exact:true}).click();await page.getByRole('status').filter({hasText:'nach dem Start'}).waitFor();
    assert.equal(calls.filter(c=>c.method==='PUT').length,0);
    await page.getByLabel('Ende (Hamburg)',{exact:true}).fill('2026-09-14T11:00');await page.getByRole('button',{name:'Speichern',exact:true}).click();
    await page.getByRole('status').filter({hasText:'gespeichert'}).waitFor();
    assert.equal(calls.find(c=>c.method==='PUT').body.startsAt,'2026-09-14T08:00:00.000Z');results.push({view:'date validation and Hamburg conversion from Kabul',pass:true});await context.close();
  }
  {
    const {page,context,calls,errors}=await pageFor('cart');await page.getByRole('button',{name:'Gutschein anwenden',exact:true}).click();
    await page.getByRole('button',{name:'Gutschein entfernen',exact:true}).waitFor();
    assert.match(await page.getByRole('link',{name:'Zur Kasse',exact:true}).getAttribute('href'),/coupon=MONTAG10/);
    assert.match(await page.locator('aside').innerText(),/90,00/);
    await page.getByRole('button',{name:'Menge von Fixture Phone erhöhen',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('a[href*="/checkout"]')?.getAttribute('href')?.includes('coupon='));
    assert.ok(calls.some(c=>c.path==='/api/coupons/validate'));assert.deepEqual(errors,[]);results.push({view:'cart verified saving, handoff and invalidation',pass:true});await context.close();
  }
  {
    const {page,context,calls,errors}=await pageFor('checkout');await page.getByText('Gutschein angewendet.',{exact:true}).waitFor();
    assert.equal(await page.locator('#checkout-coupon').inputValue(),'MONTAG10');assert.equal(calls.filter(c=>c.path==='/api/coupons/validate').length,1);
    assert.ok(!calls.some(c=>/payments|orders/.test(c.path)));assert.deepEqual(errors,[]);results.push({view:'checkout revalidates transferred code once',pass:true});await context.close();
  }
  for(const lang of ['de','en'])for(const eligible of [true,false]){
    const {page,context,calls,errors}=await pageFor('cart',lang,390,eligible?'&mixed':'&mixed&unselected');
    await page.getByText('Fixture Phone',{exact:true}).waitFor();
    await page.waitForTimeout(150);
    assert.ok(calls.some(c=>c.path==='/api/store/promotion'));
    if(eligible){
      await page.getByRole('button',{name:lang==='de'?'Gutschein anwenden':'Apply coupon',exact:true}).waitFor();
      const text=await page.locator('[data-cart-promotion]').innerText();
      assert.match(text,lang==='de'?/ausgewählte Artikel: Zubehör/:/selected items: accessories/);
      assert.ok(!text.includes('Zubehör und Reparaturen')&&!text.includes('Accessories and repairs'));
      await page.getByRole('button',{name:lang==='de'?'Gutschein anwenden':'Apply coupon',exact:true}).click();
      await page.getByRole('button',{name:lang==='de'?'Gutschein entfernen':'Remove coupon',exact:true}).waitFor();
    }else{assert.equal(await page.locator('[data-cart-promotion]').count(),0);}
    assert.deepEqual(errors,[]);results.push({view:'mixed-scope accessory basket',lang,eligible,pass:true});await context.close();
  }
  await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({passed:results.length,output}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
