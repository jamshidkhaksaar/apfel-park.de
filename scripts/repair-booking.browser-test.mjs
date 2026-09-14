import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import postcss from 'postcss';import tailwind from '@tailwindcss/postcss';
const require=createRequire(import.meta.url),{chromium}=require('/root/apfel-audit/browser/node_modules/playwright');
const root=new URL('../',import.meta.url).pathname,out='/tmp/apfel-repair-browser';await mkdir(out,{recursive:true});
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
const catalog={brands:[{id:'test',name:'Test',families:[{id:'phone',name:'Phone',models:[{id:'fixture',name:'Fixture',price:999,parts:[{id:'display',name:'Display',variants:[{id:'premium',label:'Premium',quality:'premium',price:100},{id:'other',label:'Standard',quality:'standard',price:80}]}]}]}]}]};
const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Form from './src/components/RepairRequestForm';import Admin from './src/components/admin/AdminCampaignManager';const q=new URLSearchParams(location.search),lang=q.get('lang')||'de';createRoot(document.getElementById('root')).render(<main className="container-page py-6">{q.get('view')==='admin'?<Admin locale={lang}/>:<Form lang={lang} catalog={${JSON.stringify(catalog)}}/>}</main>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'fixture',setup(b){b.onResolve({filter:/^next\/(navigation|link)$|^@\/components\/ReCaptcha$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'tsx',resolveDir:root,contents:a.path.endsWith('navigation')?'export const useSearchParams=()=>new URLSearchParams(location.search);':a.path.endsWith('ReCaptcha')?`import React from 'react';export const useReCaptcha=()=>({token:'fixture',error:null,isLoading:false,ReCaptchaComponent:()=>null});`:`import React from 'react';export default function Link(p){return <a {...p}/>} `}));}}]});
const cssPath=root+'src/app/globals.css',css=(await postcss([tailwind({base:root})]).process(await readFile(cssPath,'utf8'),{from:cssPath})).css;
const server=createServer((req,res)=>{const path=new URL(req.url,'http://fixture').pathname;if(path==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents);}else if(path==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html data-theme="mono"><head><title>Repair booking fixture</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'/root/.cache/puppeteer/chrome/linux-152.0.7977.75/chrome-linux64/chrome',args:['--no-sandbox']});const results=[];
try{
 for(const lang of ['de','en'])for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),calls=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',async route=>{const body=route.request().postDataJSON(),path=new URL(route.request().url()).pathname;calls.push({path,body});
   if(path.endsWith('/quote'))return route.fulfill({json:{success:true,quote:{selection:body.selection,requestedDate:body.requestedDate||null,preferredTime:body.preferredTime||null,baseAmountCents:10000,totalAmountCents:8500,discountAmountCents:1500,coupon:{code:'MITTWOCH15'},fingerprint:'server-preview'}}});
   return route.fulfill({json:{success:true,ticketNumber:'R-123',bookingSummary:'MITTWOCH15 · 85,00 € · appointment pending'}});
  });
  await page.goto(`${origin}/?lang=${lang}&part=display&variant=premium`);
  await page.getByLabel(lang==='de'?'Wunschdatum (optional)':'Preferred date (optional)',{exact:true}).fill(today);
  await page.getByLabel(lang==='de'?'Reparatur-Gutscheincode (optional)':'Repair coupon code (optional)',{exact:true}).fill('MITTWOCH15');
  await page.getByRole('button',{name:lang==='de'?'Gutschein prüfen':'Validate coupon',exact:true}).click();
  await page.getByRole('status').waitFor();assert.match(await page.getByRole('status').innerText(),lang==='de'?/85,00/:/85\.00/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile form overflow');
  await page.getByLabel(lang==='de'?'Name *':'Name *',{exact:true}).fill('Fixture');await page.getByLabel(lang==='de'?'E-Mail *':'Email *',{exact:true}).fill('fixture@example.invalid');await page.getByLabel(lang==='de'?'Telefon *':'Phone *',{exact:true}).fill('000000');await page.getByLabel(lang==='de'?'Fehlerbeschreibung *':'Issue description *',{exact:true}).fill('Display broken');
  if(lang==='de'&&width===390)await page.locator('[data-repair-booking-options]').screenshot({path:out+'/booking-390.png'});
  await page.getByRole('button',{name:lang==='de'?'Reparatur anfragen':'Request repair',exact:true}).click();await page.getByText('R-123',{exact:true}).waitFor();
  const saved=calls.find(c=>c.path==='/api/repairs');assert.equal(saved.body.quoteFingerprint,'server-preview');assert.equal(saved.body.requestedDate,today);assert.equal(saved.body.selection.variantId,'premium');assert.ok(saved.body.bookingKey);assert.ok(await page.getByLabel(lang==='de'?'Gerät *':'Device *',{exact:true}).inputValue(),'device remains usable for a subsequent request');assert.deepEqual(errors,[]);results.push({lang,width,flow:'repair request with validated coupon',pass:true});await context.close();
 }
 for(const lang of ['de','en']){
  const page=await browser.newPage({viewport:{width:390,height:1000}}),saves=[];
  await page.route('**/api/admin/campaigns',route=>{if(route.request().method()==='PUT')saves.push(route.request().postDataJSON());return route.fulfill({json:{success:true,campaigns:[],products:[],id:'11111111-1111-4111-8111-111111111111'}});});
  await page.goto(`${origin}/?view=admin&lang=${lang}`);await page.getByLabel(lang==='de'?'Gutscheincode':'Coupon code',{exact:true}).fill('MITTWOCH15');await page.getByLabel(lang==='de'?'Reparaturen':'Repairs',{exact:true}).check();
  await page.getByLabel(lang==='de'?'Aktionstag hinzufügen':'Add promotion date',{exact:true}).fill(today);await page.getByRole('button',{name:lang==='de'?'Hinzufügen':'Add date',exact:true}).click();
  await page.getByRole('button',{name:lang==='de'?'Speichern':'Save',exact:true}).click();await page.getByRole('status').waitFor();assert.equal(saves[0].eligibleCategories.join(','),'repairs');assert.deepEqual(saves[0].repairRules,{dateBasis:'repair_date',dates:[today]});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(lang==='de')await page.screenshot({path:out+'/campaign-390.png',fullPage:true});results.push({lang,flow:'exact repair dates in campaign',pass:true});await page.close();
 }
 await writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify({passed:results.length,out}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
