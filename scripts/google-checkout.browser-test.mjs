// MOCKED Google SDK and isolated React fixture. Never contacts a real provider.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || '/root/apfel-audit/browser/node_modules/playwright/index.mjs').href);
const root = process.cwd();
const bundle = await build({
  stdin: { contents: `
    import React, {useRef,useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import Panel from './src/components/checkout/GoogleAddressSearch';
    const q=new URLSearchParams(location.search);
    function Fixture(){
      const [shipping,setShipping]=useState(q.get('shipping')!=='pickup');
      const [mounted,setMounted]=useState(true);
      const [address,setAddress]=useState({line1:'Original 1',postalCode:'20095',city:'Hamburg',line2:'Apartment 2',name:'MOCKED Customer'});
      const revision=useRef(0);
      window.currentAddress=address;
      return <form onSubmit={e=>{e.preventDefault();window.submits=(window.submits||0)+1}}>
        <button type="button" id="shipping" onClick={()=>setShipping(s=>!s)}>Shipping</button>
        <button type="button" id="unmount" onClick={()=>setMounted(false)}>Unmount</button>
        {mounted&&shipping&&!q.has('missing')&&<Panel locale={q.get('lang')==='de'?'de':'en'} apiKey="MOCKED" manualRevision={revision} onAddress={a=>setAddress(old=>({...old,...a}))}/>}
        {Object.entries(address).map(([key,value])=><label key={key}>{key}<input name={key} value={value} onChange={e=>{revision.current++;setAddress(a=>({...a,[key]:e.target.value}))}}/></label>)}
      <button type="submit">MOCKED Submit</button></form>;
    }
    createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture/></React.StrictMode>);`,
    resolveDir: root, loader: 'tsx',
  },
  bundle: true, write: false, platform: 'browser', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
});
// Use the actual configured policies in this isolated server; provider traffic stays mocked.
const configBundle = await build({entryPoints:['next.config.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {default:nextConfig} = await import(`data:text/javascript;base64,${Buffer.from(configBundle.outputFiles[0].text).toString('base64')}`);
const configuredHeaders = await nextConfig.headers();
const server = createServer((req, res) => {
  const pathname = new URL(req.url,'http://fixture.local').pathname;
  for(const entry of configuredHeaders){
    if(entry.source==='/:path*'||entry.source===pathname){
      for(const header of entry.headers)res.setHeader(header.key,header.value);
    }
  }
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : '<!doctype html><html><body><p>MOCKED fixture</p><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath:'/root/.cache/puppeteer/chrome/linux-152.0.7977.75/chrome-linux64/chrome',headless:true,args:['--no-sandbox']});
const mockSdk = `
 window.mockPending={};
 class MockAutocomplete extends HTMLElement {
  constructor(options){
    super();window.mockOptions=options;
    const input=document.createElement('input');input.setAttribute('aria-label','MOCKED input');
    this.append(input);
  }
 }
 customElements.define('mock-autocomplete',MockAutocomplete);
 window.mockImports=0;
 window.google={maps:{importLibrary:async()=>{window.mockImports++;return {PlaceAutocompleteElement:MockAutocomplete}}}};
 window.mockSelect=(id,mode='valid',delay=false)=>{
   const place={fetchFields:async(options)=>{
     window.mockFields=options.fields;
     if(delay)await new Promise((resolve,reject)=>window.mockPending[id]={resolve,reject});
     if(mode==='failure')throw Error('MOCKED details failure');
     place.addressComponents=[
       {longText:id,types:['route']},
       ...(mode==='incomplete'?[]:[{longText:'12',types:['street_number']}]),
       {longText:'10115',types:['postal_code']},{longText:'Berlin',types:['locality']},
       {longText:'Deutschland',shortText:mode==='foreign'?'AT':'DE',types:['country']}
     ];
   }};
   const event=new Event('gmp-select');event.placePrediction={toPlace:()=>place};
   document.querySelector('mock-autocomplete').dispatchEvent(event);
 };
`;
let failures = 0;
const test = async (name, fn) => {
  try { await fn(); console.log('PASS MOCKED:', name); }
  catch(error) { failures++; console.error('FAIL MOCKED:',name,error); }
};
const fresh = async (query = '', mode = 'success') => {
  const page = await browser.newPage();
  page.setDefaultTimeout(2000);
  let requests = 0;
  await page.route('**/*', async route => {
    if(route.request().url().startsWith(base)) return route.continue();
    requests++;
    assert.match(route.request().url(), /^https:\/\/maps.googleapis.com\/maps\/api\/js\?/);
    if(mode==='network') return route.abort();
    if(mode==='timeout') return; // deliberately unresolved; page close cancels MOCKED request
    if(mode==='auth') return route.fulfill({contentType:'text/javascript',body:'window.gm_authFailure?.()'});
    return route.fulfill({contentType:'text/javascript',body:mockSdk});
  });
  await page.goto(base+(query.includes('lang=de')?'/de/checkout':'/en/checkout')+query);
  await page.locator('input[name=line1]').waitFor();
  return {page,requests:()=>requests};
};
const activate = async page => {
  await page.getByRole('button',{name:'Enable Google address search',exact:true}).click();
  await page.locator('mock-autocomplete').waitFor();
};
const activateLocalized = async (page,query) => {
  if(!query)return activate(page);
  await page.locator('[data-google-address-search] button').click();
  await page.locator('mock-autocomplete').waitFor();
};
const select = async (page,id,mode='valid',delay=false) => page.evaluate(([id,mode,delay])=>window.mockSelect(id,mode,delay),[id,mode,delay]);
const line = page => page.locator('input[name=line1]');
try {
 await test('fixture serves configured checkout CSP without weakening other routes',async()=>{
   for(const path of ['/de/checkout','/en/checkout','/de/store','/de/checkout/child']){
     const response=await fetch(base+path);
     const policy=response.headers.get('content-security-policy');
     assert.ok(policy,'fixture must exercise configured CSP');
     const scripts=policy.split('; ').find(d=>d.startsWith('script-src '));
     assert.equal(scripts.includes('https://maps.googleapis.com'),path==='/de/checkout'||path==='/en/checkout');
     assert.ok(!policy.includes("'unsafe-eval'"));
   }
 });
 await test('no Google load before explicit activation, pickup, missing key; localized privacy',async()=>{
   for(const query of ['', '?shipping=pickup','?missing','?lang=de']){
     const {page,requests}=await fresh(query);
     assert.equal(requests(),0);
     if(query.includes('pickup')||query.includes('missing'))assert.equal(await page.locator('[data-google-address-search]').count(),0);
     else assert.equal(await page.locator('a[href$="/privacy"]').getAttribute('href'), query.includes('de')?'/de/privacy':'/en/privacy');
     await page.close();
   }
 });
 await test('selection fills only manual delivery fields, editable, Enter confined to widget',async()=>{
   const {page,requests}=await fresh();await activate(page);assert.equal(requests(),1);
   assert.deepEqual(await page.evaluate(()=>window.mockOptions),{includedRegionCodes:['de'],requestedLanguage:'en'});
   await select(page,'Teststraße');
   await page.waitForFunction(()=>window.currentAddress.line1==='Teststraße 12');
   assert.deepEqual(await page.evaluate(()=>window.mockFields),['addressComponents']);
   assert.equal(await page.locator('input[name=line2]').inputValue(),'Apartment 2');
   assert.equal(await page.locator('input[name=name]').inputValue(),'MOCKED Customer');
   await line(page).fill('Manual 8');assert.equal(await line(page).inputValue(),'Manual 8');
   await page.locator('mock-autocomplete input').press('Enter');assert.equal(await page.evaluate(()=>window.submits||0),0);
   await line(page).press('Enter');assert.equal(await page.evaluate(()=>window.submits),1);
   await page.close();
 });
 await test('incomplete, foreign and failed details preserve manual values and announce fallback',async()=>{
   const {page}=await fresh();await activate(page);
   for(const mode of ['incomplete','foreign','failure']){
     await select(page,'Rejected',mode);
     await page.waitForFunction(()=>document.querySelector('[aria-live]').textContent.includes('manually'));
     assert.equal(await line(page).inputValue(),'Original 1');
   }
   await page.close();
 });
 await test('newer selection and manual typing win over pending details',async()=>{
   const {page}=await fresh();await activate(page);
   await select(page,'Old','valid',true);await select(page,'New');
   await page.waitForFunction(()=>window.currentAddress.line1==='New 12');
   await page.evaluate(()=>window.mockPending.Old.resolve());await page.waitForTimeout(30);
   assert.equal(await line(page).inputValue(),'New 12');
   await select(page,'Pending','valid',true);await line(page).fill('Typed 9');
   await page.evaluate(()=>window.mockPending.Pending.resolve());await page.waitForTimeout(30);
   assert.equal(await line(page).inputValue(),'Typed 9');
   await page.close();
 });
 await test('disable, shipping switch, withdrawal and unmount remove widget and ignore late details; reactivation explicit',async()=>{
   for(const action of ['disable','shipping','withdraw','unmount']){
     const {page,requests}=await fresh();await activate(page);await select(page,'Late','valid',true);
     if(action==='disable')await page.getByRole('button',{name:'Disable Google address search',exact:true}).click();
     if(action==='shipping')await page.locator('#shipping').click();
     if(action==='unmount')await page.locator('#unmount').click();
     if(action==='withdraw')await page.evaluate(()=>{document.cookie='apfel-consent=necessary; path=/';window.dispatchEvent(new CustomEvent('apfel-consent-change',{detail:'necessary'}));});
     assert.equal(await page.locator('mock-autocomplete').count(),0);
     assert.equal(await page.evaluate(()=>typeof window.gm_authFailure),'undefined');
     await page.evaluate(()=>window.mockPending.Late.resolve());await page.waitForTimeout(30);
     assert.equal(await line(page).inputValue(),'Original 1');
     if(action==='shipping')await page.locator('#shipping').click();
     if(action!=='unmount'){await activate(page);assert.equal(requests(),1);}
     await page.close();
   }
 });
 await test('late SDK auth failure preserves manual fields, removes widget and requires fresh explicit retry',async()=>{
   for(const query of ['', '?lang=de']){
     const {page,requests}=await fresh(query);await activateLocalized(page,query);
     await line(page).fill('Manual late 7');
     const before=await page.evaluate(()=>window.currentAddress);
     await select(page,'LateAuth','valid',true);
     assert.equal(await page.evaluate(()=>window.mockImports),1);
     await page.evaluate(()=>window.gm_authFailure?.());
     await page.waitForFunction(()=>document.querySelector('mock-autocomplete')===null);
     assert.match(await page.locator('[aria-live]').textContent(),query ? /manuell/ : /manually/);
     await page.evaluate(()=>window.mockPending.LateAuth.resolve());
     assert.deepEqual(await page.evaluate(()=>window.currentAddress),before);
     assert.equal(await page.evaluate(()=>window.mockImports),1);
     await activateLocalized(page,query);
     assert.equal(await page.evaluate(()=>window.mockImports),2);
     assert.equal(requests(),1);
     await page.close();
   }
 });
 await test('script network/auth failures and timeout keep manual entry available',async()=>{
   for(const mode of ['network','auth','timeout']){
     const {page}=await fresh('',mode);
     if(mode==='timeout')await page.clock.install();
     await page.getByRole('button',{name:'Enable Google address search',exact:true}).click();
     if(mode==='timeout')await page.clock.fastForward(16000);
     await page.waitForFunction(()=>document.querySelector('[aria-live]').textContent.includes('manually'));
     await line(page).fill('Fallback 4');assert.equal(await line(page).inputValue(),'Fallback 4');
     await page.close();
   }
 });
 await test('disable during initialization prevents late widget creation',async()=>{
   const {page}=await fresh('','timeout');
   await page.getByRole('button',{name:'Enable Google address search',exact:true}).click();
   await page.getByRole('button',{name:'Disable Google address search',exact:true}).click();
   await page.evaluate(()=>{window.google={maps:{importLibrary:async()=>({PlaceAutocompleteElement:class extends HTMLElement{}})}};document.querySelector('script[src*="maps.googleapis"]').dispatchEvent(new Event('load'));});
   await page.waitForTimeout(30);assert.equal(await page.locator('[data-google-address-widget]').textContent(),'');
   await page.close();
 });
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
if(failures)process.exitCode=1;
