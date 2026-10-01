// MOCKED Google SDK and isolated React fixture. Never contacts a real provider.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || '/root/apfel-audit/browser/node_modules/playwright/index.mjs').href);
const root = process.cwd();
const bundle = await build({
  stdin: { contents: `
    import React, {useRef,useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import Street from './src/components/checkout/CheckoutStreetAddress';
    const q=new URLSearchParams(location.search);
    function Fixture(){
      const [shipping,setShipping]=useState(q.get('shipping')!=='pickup');
      const [mounted,setMounted]=useState(true);
      const [address,setAddress]=useState({line1:'',postalCode:'20095',city:'Hamburg',line2:'Apartment 2',name:'MOCKED Customer'});
      const revision=useRef(0);
      window.currentAddress=address;
      window.unmountStreet=()=>setMounted(false);
      const change=(key,value)=>{revision.current++;setAddress(a=>({...a,[key]:value}))};
      return <form onSubmit={e=>{e.preventDefault();window.submits=(window.submits||0)+1}}>
        <button type="button" id="shipping" onClick={()=>setShipping(s=>!s)}>Shipping</button>
        <button type="button" id="unmount" onClick={()=>setMounted(false)}>Unmount</button>
        {mounted&&shipping&&<div><label htmlFor="fixture-street">Street and number</label><Street locale={q.get('lang')==='de'?'de':'en'} apiKey={q.has('missing')?undefined:'MOCKED'} manualRevision={revision} onAddress={a=>{revision.current++;setAddress(old=>({...old,...a}))}} inputProps={{id:'fixture-street',name:'line1',className:'mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground',required:true,'data-checkout-field':'line1',value:address.line1,onChange:e=>change('line1',e.target.value),onKeyDown:e=>{(window.forwardedKeys||=[]).push({key:e.key,prevented:e.defaultPrevented})},onCompositionStart:()=>{window.compositionStarts=(window.compositionStarts||0)+1},onCompositionEnd:()=>{window.compositionEnds=(window.compositionEnds||0)+1}}}/></div>}
        {Object.entries(address).filter(([key])=>key!=='line1').map(([key,value])=><label key={key}>{key}<input name={key} value={value} onChange={e=>change(key,e.target.value)}/></label>)}
      <button type="submit">MOCKED Submit</button></form>;
    }
    createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture/></React.StrictMode>);`,
    resolveDir: root, loader: 'tsx',
  },
  bundle: true, write: false, platform: 'browser', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
});
// Actual checkout client with routing/image shells only; no payment SDK is mounted.
const checkoutBundle = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import Checkout from './src/components/checkout/CheckoutClient';const q=new URLSearchParams(location.search);createRoot(document.getElementById('root')).render(<React.StrictMode><Checkout locale={q.get('lang')==='de'?'de':'en'} initialShippingMethod="germany" googlePlacesApiKey="MOCKED"/></React.StrictMode>);`, resolveDir:root, loader:'tsx' },
  bundle:true,write:false,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"','process.env':'{}'},
  plugins:[{name:'fixture-next-shells',setup(b){
    b.onResolve({filter:/^next\/(link|image|dynamic)$/},a=>({path:a.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},a=>({resolveDir:root,loader:'tsx',contents:
      a.path.endsWith('dynamic')?'export default ()=>()=>null':
      a.path.endsWith('image')?`import React from 'react';export default function Image({fill,unoptimized,...props}){return <img {...props}/>}`:
      `import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>} `
    }));
  }}],
});
const styles = await postcss([tailwind()]).process(await readFile('src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});
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
  if(pathname==='/style.css'){res.setHeader('Content-Type','text/css');res.end(styles.css);return;}
  if(pathname==='/api/cart/validate'){
    // Synthetic catalog/cart; no database or real order operation.
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({success:true,cart:{items:[{key:'MOCKED',productId:'MOCKED',slug:'mocked',title:'MOCKED phone',image:'',category:'phone',quantity:1,unitAmount:100,unitAmountCents:10000,lineAmount:100,lineAmountCents:10000,condition:'new'}],currency:'EUR',subtotalAmount:100,subtotalAmountCents:10000,shippingAmount:6.9,shippingAmountCents:690,totalAmount:106.9,totalAmountCents:10690,vatRate:19,vatAmount:17.07,vatAmountCents:1707,shippingMethod:'germany'}}));return;
  }
  if(pathname.startsWith('/api/')){res.writeHead(403);res.end('MOCKED: checkout/payment APIs blocked');return;}
  res.setHeader('Content-Type', pathname === '/bundle.js' ? 'text/javascript' : 'text/html');
  res.end(pathname === '/bundle.js' ? (req.url.includes('integration')?checkoutBundle:bundle).outputFiles[0].text : '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body class="bg-background text-foreground"><p>MOCKED fixture</p><div id="root"></div><script src="/bundle.js'+(req.url.includes('integration')?'?integration':'')+'"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath:'/root/.cache/puppeteer/chrome/linux-152.0.7977.75/chrome-linux64/chrome',headless:true,args:['--no-sandbox']});
const mockSdk = `
 window.mockPending={};window.mockQueries=[];window.mockTokens=0;window.mockFields=[];
 window.mockMode='valid';window.mockDelayDetails=false;window.mockDelayQueries=false;
 window.google={maps:{importLibrary:async()=>({
   AutocompleteSessionToken:class {constructor(){this.id=++window.mockTokens}},
   AutocompleteSuggestion:{fetchAutocompleteSuggestions:async request=>{
     window.mockQueries.push(request);
     if(window.mockDelayQueries)await new Promise(resolve=>window.mockPending[request.input]={resolve});
     if(window.mockMode==='queryFailure')throw Error('MOCKED query');
     return {suggestions:Array.from({length:window.mockCount||2},(_,i)=>i).map(i=>({placePrediction:{text:{toString:()=>request.input+' result '+i},toPlace:()=>{
       const mode=window.mockMode,delay=window.mockDelayDetails;
       const place={fetchFields:async options=>{
         window.mockFields.push(options.fields);
         if(delay)await new Promise((resolve,reject)=>window.mockPending[request.input]={resolve,reject});
         if(mode==='failure')throw Error('MOCKED details');
         place.addressComponents=[{longText:request.input+i,types:['route']},
           ...(mode==='house'?[]:[{longText:'12',types:['street_number']}]),
           ...(mode==='postcode'?[]:[{longText:'10115',types:['postal_code']}]),
           {longText:'Berlin',types:['locality']},
           ...(mode==='country'?[]:[{shortText:mode==='foreign'?'AT':'DE',types:['country']}])];
       }};return place;
     }}}))};
   }}
 })}};
`;
let failures = 0;
const test = async (name, fn) => {
  try { await fn(); console.log('PASS MOCKED:', name); }
  catch(error) { failures++; console.error('FAIL MOCKED:',name,error); }
};
const fresh = async (query = '', mode = 'success') => {
  const page = await browser.newPage({hasTouch:true});
  page.setDefaultTimeout(2000);
  page.setDefaultNavigationTimeout(10000);
  page.on('pageerror',error=>console.error('MOCKED fixture page error:',error.message));
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
  await page.addInitScript(({consent})=>{if(consent)document.cookie='apfel-consent=external; path=/';localStorage.setItem('apfel-cart-v1',JSON.stringify([{productId:'MOCKED',quantity:1}]));}, {consent:!query.includes('denied')});
  await page.goto(base+(query.includes('lang=de')?'/de/checkout':'/en/checkout')+query);
  await page.locator(query.includes('integration')?'[data-checkout-field=line1]':'form').waitFor();
  return {page,requests:()=>requests};
};
const line = page => page.locator('input[name=line1]');
const query = async (page,value='Teststraße') => {await line(page).fill(value);await page.getByRole('option').first().waitFor();};
const consent = async (page,mode) => page.evaluate(mode=>{document.cookie='apfel-consent='+mode+'; path=/';window.dispatchEvent(new Event('apfel-consent-change'));},mode);
try {
 const geometry = async page => page.evaluate(()=>{
   const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
   const input=document.querySelector('input[name=line1]'),footer=[...document.querySelectorAll('[translate=no]')].find(el=>el.textContent==='Google Maps');
   const vv=window.visualViewport;
   return {input:rect(input),menu:rect(footer.parentElement),footer:rect(footer),list:rect(document.querySelector('[role=listbox]')),
     top:Math.max(vv?.offsetTop||0,document.querySelector('.site-header')?.getBoundingClientRect().bottom||0),
     bottom:(vv?.offsetTop||0)+(vv?.height||innerHeight),left:vv?.offsetLeft||0,right:(vv?.offsetLeft||0)+(vv?.width||innerWidth)};
 });
 const fits = async (page,side) => {
   await page.waitForTimeout(50);
   const g=await geometry(page);
   assert.ok(g.menu.top>=g.top-1&&g.menu.bottom<=g.bottom+1,JSON.stringify(g));
   assert.ok(g.footer.top>=g.top&&g.footer.bottom<=g.bottom+1,'attribution inside usable viewport');
   assert.ok(g.menu.left>=g.left-1&&g.menu.right<=g.right+1,'no horizontal overflow');
   assert.ok(Math.abs(g.input.left-g.menu.left)<1&&Math.abs(g.input.width-g.menu.width)<1,'input alignment');
   assert.ok(g.list.height<=240,'preserve option scroll cap');
   if(side==='above')assert.ok(g.menu.bottom<=g.input.top,'must flip above');
   if(side==='below')assert.ok(g.menu.top>=g.input.bottom,'must open below');
   return g;
 };
 const position = async (page,top) => page.evaluate(top=>{
   const form=document.querySelector('form');form.style.minHeight='1800px';
   form.style.paddingTop=(parseFloat(form.style.paddingTop||'0')+top-document.querySelector('input[name=line1]').getBoundingClientRect().top)+'px';
 },top);
 await test('viewport placement keeps attribution visible near top/bottom on mobile and desktop; selection survives flips',async()=>{
   for(const width of [375,1280]){
     const {page}=await fresh();await page.setViewportSize({width,height:800});
     await page.evaluate(()=>{const h=document.createElement('header');h.className='site-header';h.style.cssText='position:fixed;top:0;height:72px;width:100%;z-index:50';document.body.prepend(h)});
     await position(page,700);await query(page,'Bottom');await fits(page,'above');
     // Pointer selection uses the actual touch-capable context on mobile.
     if(width===375)await page.getByRole('option').first().tap();else await page.getByRole('option').first().click();
     await page.waitForFunction(()=>window.currentAddress.line1==='Bottom0 12');
     await query(page,'Flipped keyboard');await fits(page,'above');
     await line(page).press('ArrowDown');await line(page).press('Enter');
     await page.waitForFunction(()=>window.currentAddress.line1==='Flipped keyboard0 12');
     await position(page,100);await query(page,'Top');await fits(page,'below');
     await page.setViewportSize({width,height:260});await fits(page,'below');
     await page.evaluate(()=>window.scrollTo(0,25));await fits(page,'below');
     await line(page).press('ArrowDown');await line(page).press('Enter');
     await page.waitForFunction(()=>window.currentAddress.line1==='Top0 12');
     assert.equal(await line(page).evaluate(el=>el===document.activeElement),true);await page.close();
   }
 });
 await test('visualViewport offsets/keyboard, ancestor scroll, bounded options and listener cleanup',async()=>{
   const {page}=await fresh();await page.setViewportSize({width:375,height:800});
   await page.evaluate(()=>{
     const vv=new EventTarget();Object.assign(vv,{offsetTop:0,offsetLeft:0,height:800,width:375});
     Object.defineProperty(window,'visualViewport',{configurable:true,value:vv});window.mockViewport=vv;
     window.geometryListeners=[];window.geometryObservers=0;
     const NativeObserver=window.ResizeObserver;
     window.ResizeObserver=class extends NativeObserver {
       constructor(callback){super(callback);window.geometryObservers++}
       disconnect(){window.geometryObservers--;super.disconnect()}
     };
     for(const target of [window,vv]){
       const add=target.addEventListener.bind(target),remove=target.removeEventListener.bind(target);
       target.addEventListener=(type,fn,options)=>{if(type==='scroll'||type==='resize')window.geometryListeners.push({target,type,fn});add(type,fn,options)};
       target.removeEventListener=(type,fn,options)=>{window.geometryListeners=window.geometryListeners.filter(l=>!(l.target===target&&l.type===type&&l.fn===fn));remove(type,fn,options)};
     }
   });
   await position(page,500);await query(page,'Keyboard');
   await page.evaluate(()=>{window.mockViewport.height=580;window.mockViewport.dispatchEvent(new Event('resize'))});await fits(page,'above');
   await page.evaluate(()=>{window.mockViewport.offsetTop=350;window.mockViewport.dispatchEvent(new Event('scroll'))});await fits(page,'below');
   await page.evaluate(()=>{window.mockCount=12});await query(page,'Many');
   await page.evaluate(()=>{window.mockViewport.offsetTop=0;window.mockViewport.height=650;window.mockViewport.dispatchEvent(new Event('resize'))});await fits(page,'above');
   await page.evaluate(()=>{
     const root=document.getElementById('root');root.style.height='600px';root.style.overflowY='auto';root.scrollTop=300;
   });await fits(page,'below');
   await line(page).press('ArrowUp');await fits(page,'below');
   const activeBox=await page.locator('[aria-selected=true]').boundingBox(),listBox=await page.getByRole('listbox').boundingBox();
   assert.ok(activeBox.y>=listBox.y-1&&activeBox.y+activeBox.height<=listBox.y+listBox.height+1,'last option scrolls within list');
   assert.equal(await page.evaluate(()=>window.geometryObservers),1,'one active geometry observer');
   assert.equal(await page.evaluate(()=>window.geometryListeners.length),4,'open menu subscribes once to viewport/scroll events');
   await line(page).press('Escape');assert.equal(await page.evaluate(()=>window.geometryListeners.length),0,'closed menu removes listeners');assert.equal(await page.evaluate(()=>window.geometryObservers),0);
   await query(page,'Unmount');await page.evaluate(()=>window.unmountStreet());assert.equal(await page.evaluate(()=>window.geometryListeners.length),0,'unmounted menu removes listeners');assert.equal(await page.evaluate(()=>window.geometryObservers),0);
   await page.close();
 });
 await test('configured checkout-only CSP remains exact and has no unsafe-eval',async()=>{
   for(const path of ['/de/checkout','/en/checkout','/de/store','/de/checkout/child']){
     const policy=(await fetch(base+path)).headers.get('content-security-policy');
     const scripts=policy.split('; ').find(d=>d.startsWith('script-src '));
     assert.equal(scripts.includes('https://maps.googleapis.com'),path==='/de/checkout'||path==='/en/checkout');
     assert.ok(!policy.includes("'unsafe-eval'"));
   }
 });
 await test('actual checkout uses one labeled street field, preserves errors and manual/contact fields under candidate CSP',async()=>{
   for(const lang of ['de','en']){
     const {page}=await fresh('?integration&lang='+lang);
     await page.setViewportSize({width:lang==='de'?375:1280,height:900});
     await page.evaluate(t=>document.documentElement.dataset.theme=t,lang==='de'?'mono':'dark');
     const street=page.getByRole('combobox',{name:lang==='de'?'Straße und Hausnummer *':'Street and number *',exact:true});
     assert.equal(await street.count(),1);assert.equal(await page.locator('[data-checkout-field=line1]').count(),1);
     assert.equal(await street.getAttribute('required'),'');
     await page.locator('[data-checkout-field=name]').fill('MOCKED Customer');
     await page.locator('[data-checkout-field=email]').fill('mocked@example.invalid');
     await page.locator('input[autocomplete=address-line2]').fill('Apartment 2');
     await page.getByRole('button',{name:lang==='de'?'Sicher zur Kasse':'Secure checkout',exact:true}).click();
     assert.equal(await street.getAttribute('aria-invalid'),'true');
     assert.ok((await street.getAttribute('aria-describedby')).split(' ').includes('checkout-error-summary'));
     await street.fill('Hamburg');await page.getByRole('option').first().waitFor();assert.equal(await street.count(),1);
     const inputBox=await street.boundingBox(),listBox=await page.getByRole('listbox').boundingBox();
     assert.ok(Math.abs(inputBox.width-listBox.width)<3);assert.ok(listBox.x>=0&&listBox.x+listBox.width<=page.viewportSize().width);
     await page.getByRole('option').first().click();await page.waitForFunction(()=>document.querySelector('[data-checkout-field=line1]').value==='Hamburg0 12');
     assert.equal(await page.locator('[data-checkout-field=postalCode]').inputValue(),'10115');assert.equal(await page.locator('[data-checkout-field=city]').inputValue(),'Berlin');
     assert.equal(await page.locator('[data-checkout-field=name]').inputValue(),'MOCKED Customer');assert.equal(await page.locator('input[autocomplete=address-line2]').inputValue(),'Apartment 2');
     await street.fill('Manual 9');assert.equal(await street.inputValue(),'Manual 9');
     assert.equal(await page.locator('[data-google-address-search]').count(),0);
     await page.close();
   }
 });
 await test('consent gates all SDK traffic; focused grant resumes; missing key and pickup remain manual',async()=>{
   for(const q of ['?denied','?missing','?shipping=pickup']){
     const {page,requests}=await fresh(q);
     if(!q.includes('pickup')){await line(page).fill('Hamburg');await page.waitForTimeout(400);}
     assert.equal(requests(),0);
     assert.equal(await page.locator('input[name=line1]').count(),q.includes('pickup')?0:1);
     assert.equal(await page.locator('[data-google-address-search],mock-autocomplete').count(),0);
     assert.equal(await page.getByRole('button',{name:/Enable Google|Disable Google/}).count(),0);
     if(q==='?denied'){
       await page.evaluate(()=>{window.settings=0;window.addEventListener('apfel-consent-open',()=>window.settings++)});
       await page.getByRole('button',{name:'Cookie settings'}).click();assert.equal(await page.evaluate(()=>window.settings),1);
       assert.equal(requests(),0);await line(page).focus();await consent(page,'external');await page.getByRole('option').first().waitFor();
       await consent(page,'necessary');assert.equal(await page.getByRole('option').count(),0);assert.equal(await line(page).inputValue(),'Hamburg');
     }
     await page.close();
   }
 });
 await test('debounce, locale options, token reuse/rotation, mouse selection and attribution on mobile/desktop themes',async()=>{
   for(const lang of ['en','de'])for(const theme of ['light','dark']){
     const {page}=await fresh('?lang='+lang);
     await page.setViewportSize({width:theme==='light'?375:1280,height:800});
     await page.evaluate(t=>document.documentElement.dataset.theme=t,theme==='light'?'mono':theme);
     await line(page).fill('Te');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>!!window.google),false);
     await line(page).fill('Test');await page.waitForTimeout(80);await line(page).fill('Teststraße');
     await page.getByRole('option').first().waitFor();
     assert.equal(await page.evaluate(()=>window.mockQueries.length),1);
     await query(page,'Nextstraße');
     const requests=await page.evaluate(()=>window.mockQueries);
     assert.equal(requests[0].sessionToken.id,requests[1].sessionToken.id);
     assert.deepEqual(requests[0].includedRegionCodes,['de']);assert.equal(requests[0].language,lang);assert.equal(requests[0].region,'de');
     assert.ok(await page.getByText('Google Maps',{exact:true}).isVisible());
     await page.getByRole('option').first().click();await page.waitForFunction(()=>window.currentAddress.line1==='Nextstraße0 12');
     assert.equal(await line(page).evaluate(el=>el===document.activeElement),true);
     assert.deepEqual(await page.evaluate(()=>window.mockFields),[['addressComponents']]);
     assert.equal(await page.locator('input[name=line2]').inputValue(),'Apartment 2');
     assert.equal(await page.locator('input[name=name]').inputValue(),'MOCKED Customer');
     await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.mockQueries.length),2);
     await query(page,'New query');assert.notEqual(await page.evaluate(()=>window.mockQueries[2].sessionToken.id),requests[0].sessionToken.id);
     await page.close();
   }
 });
 await test('combobox active IDs, arrows, Enter selection, Escape, Tab and blur',async()=>{
   const {page}=await fresh();await query(page);
   assert.equal(await line(page).getAttribute('aria-autocomplete'),'list');
   assert.equal(await line(page).getAttribute('aria-expanded'),'true');
   const controls=await line(page).getAttribute('aria-controls');assert.equal(await page.locator('[id="'+controls+'"]').getAttribute('role'),'listbox');
   await line(page).press('Enter');assert.equal(await page.evaluate(()=>window.submits||0),0);assert.equal(await line(page).inputValue(),'Teststraße');
   await line(page).press('ArrowDown');const id=await line(page).getAttribute('aria-activedescendant');assert.ok(id);
   assert.equal(await page.locator('[id="'+id+'"]').getAttribute('aria-selected'),'true');
   await line(page).press('ArrowDown');await line(page).press('ArrowUp');await line(page).press('Enter');
   await page.waitForFunction(()=>window.currentAddress.line1==='Teststraße0 12');assert.equal(await page.evaluate(()=>window.submits||0),0);
   for(const key of ['Escape','Tab']){await query(page,'Close '+key);await line(page).press(key);assert.equal(await page.getByRole('option').count(),0);assert.equal(await line(page).getAttribute('aria-activedescendant'),null);}
   await query(page,'Blur');await page.locator('input[name=city]').focus();assert.equal(await page.getByRole('option').count(),0);
   await line(page).focus();await line(page).press('Escape');await line(page).press('Enter');assert.equal(await page.evaluate(()=>window.submits||0),1);
   await page.close();
 });
 for(const mode of ['missing','denied','queryFailure','network','dismissed','selected','pending','composition'])await test('native Enter in isolated synthetic form: '+mode,async()=>{
   const {page,requests}=await fresh(mode==='missing'||mode==='denied'?'?'+mode:'',mode==='network'?'network':'success');
   if(mode==='missing'||mode==='denied'){
     await line(page).fill('Manual 9');await page.waitForTimeout(400);assert.equal(requests(),0);
   }else if(mode==='network'){
     await line(page).fill('Manual 9');await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('manually'));
   }else{
     await query(page);
     if(mode==='queryFailure'){
       await page.evaluate(()=>window.mockMode='queryFailure');await line(page).fill('Manual 9');
       await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('manually'));
     }
     if(mode==='dismissed')await line(page).press('Escape');
     if(mode==='selected'){
       await line(page).press('ArrowDown');await line(page).press('Enter');
       await page.waitForFunction(()=>window.currentAddress.line1==='Teststraße0 12');
     }
     if(mode==='pending'){
       await page.evaluate(()=>window.mockDelayQueries=true);await line(page).fill('Pending');
       await page.waitForFunction(()=>!!window.mockPending.Pending);
     }
     if(mode==='composition'){
       await line(page).press('ArrowDown');await line(page).dispatchEvent('compositionstart');await line(page).fill('Interim');
     }
   }
   assert.equal(await page.getByRole('option').count(),0);
   const before=await page.evaluate(()=>({address:window.currentAddress,submits:window.submits||0,fields:window.mockFields?.length||0,queries:window.mockQueries?.length||0}));
   await line(page).press('Enter');
   assert.equal(await page.evaluate(()=>window.submits||0),before.submits+1,'closed/manual Enter must submit the isolated form');
   assert.deepEqual(await page.evaluate(()=>window.forwardedKeys.at(-1)),{key:'Enter',prevented:false});
   assert.deepEqual(await page.evaluate(()=>window.currentAddress),before.address);
   assert.equal(await page.evaluate(()=>window.mockFields?.length||0),before.fields);
   if(mode==='composition'){
     await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.mockQueries.length),before.queries);
   }
   await page.close();
 });
 await test('composing native keys preserve callbacks and never navigate, select or prevent defaults',async()=>{
   const {page}=await fresh();await query(page);await line(page).press('ArrowDown');
   const active=await line(page).getAttribute('aria-activedescendant');
   for(const key of ['ArrowDown','ArrowUp','Enter','Escape','Tab']){
     const prevented=await line(page).evaluate((el,key)=>!el.dispatchEvent(new KeyboardEvent('keydown',{key,isComposing:true,bubbles:true,cancelable:true})),key);
     assert.equal(prevented,false,'composing '+key+' must retain native default');
     assert.equal(await line(page).getAttribute('aria-activedescendant'),active);
   }
   assert.deepEqual(await page.evaluate(()=>window.forwardedKeys.slice(-5)),['ArrowDown','ArrowUp','Enter','Escape','Tab'].map(key=>({key,prevented:false})));
   assert.equal(await page.evaluate(()=>window.mockFields.length),0);assert.equal(await line(page).inputValue(),'Teststraße');
   await page.close();
 });
 await test('composition closes suggestions, defers interim requests and resumes committed text',async()=>{
   const {page,requests}=await fresh();await line(page).focus();
   await line(page).dispatchEvent('compositionstart');await line(page).fill('Interim');await page.waitForTimeout(400);
   assert.equal(requests(),0,'interim composition must not load the provider');
   await line(page).dispatchEvent('compositionend',{data:'Interim'});await page.getByRole('option').first().waitFor();
   assert.deepEqual(await page.evaluate(()=>window.mockQueries.map(q=>q.input)),['Interim']);
   await line(page).press('ArrowDown');await line(page).dispatchEvent('compositionstart');
   assert.equal(await page.getByRole('option').count(),0,'composition start must close the existing list');
   await line(page).fill('Committed');await line(page).press('ArrowDown');
   const prevented=await line(page).evaluate(el=>!el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));
   assert.equal(prevented,false,'composition lifecycle must guard keys even without native isComposing');
   await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.mockQueries.length),1);
   await line(page).dispatchEvent('compositionend',{data:'Committed'});await page.getByRole('option').first().waitFor();
   assert.deepEqual(await page.evaluate(()=>window.mockQueries.map(q=>q.input)),['Interim','Committed']);
   assert.deepEqual(await page.evaluate(()=>[window.compositionStarts,window.compositionEnds]),[2,2]);
   assert.equal(await line(page).inputValue(),'Committed');await page.close();
 });
 await test('composition invalidates debounce, pending predictions and pending details',async()=>{
   for(const phase of ['debounce','predictions','details']){
     const {page}=await fresh();await query(page,'Initial');
     if(phase==='predictions')await page.evaluate(()=>window.mockDelayQueries=true);
     if(phase==='details'){
       await page.evaluate(()=>window.mockDelayDetails=true);await page.getByRole('option').first().click();
       await page.waitForFunction(()=>!!window.mockPending.Initial);
     }else{
       await line(page).fill('Pending');
       if(phase==='predictions')await page.waitForFunction(()=>!!window.mockPending.Pending);
     }
     const before=await page.evaluate(()=>window.currentAddress);
     await line(page).dispatchEvent('compositionstart');
     if(phase!=='debounce')await page.evaluate(phase=>window.mockPending[phase==='details'?'Initial':'Pending'].resolve(),phase);
     await page.waitForTimeout(400);
     assert.equal(await page.getByRole('option').count(),0,'late '+phase+' must not reopen suggestions');
     assert.deepEqual(await page.evaluate(()=>window.currentAddress),before,'late details must not replace composing text');
     assert.equal(await page.evaluate(()=>window.mockQueries.length),phase==='predictions'?2:1);
     await page.close();
   }
 });
 await test('invalid and failed details preserve typed fields; query failures fall back',async()=>{
   const {page}=await fresh();
   for(const mode of ['house','postcode','country','foreign','failure']){
     await query(page,mode);await page.evaluate(m=>window.mockMode=m,mode);await page.getByRole('option').first().click();
     await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('manually'));
     assert.equal(await line(page).inputValue(),mode);
     await page.evaluate(()=>window.mockMode='valid');
   }
   await page.evaluate(()=>window.mockMode='queryFailure');await line(page).fill('Failure query');
   await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('manually'));assert.equal(await page.getByRole('option').count(),0);
   await page.close();
 });
 await test('out-of-order predictions never display stale options',async()=>{
   const {page}=await fresh();await query(page);await page.evaluate(()=>window.mockDelayQueries=true);
   await line(page).fill('Old');await page.waitForFunction(()=>!!window.mockPending.Old);
   await line(page).fill('New');await page.waitForFunction(()=>!!window.mockPending.New);
   await page.evaluate(()=>window.mockPending.New.resolve());await page.getByRole('option').first().waitFor();
   await page.evaluate(()=>window.mockPending.Old.resolve());await page.waitForTimeout(50);assert.match(await page.getByRole('option').first().textContent(),/^New/);
   await line(page).fill('Abandoned');await page.waitForFunction(()=>!!window.mockPending.Abandoned);await line(page).press('Escape');
   await page.evaluate(()=>window.mockPending.Abandoned.resolve());await page.waitForTimeout(50);assert.equal(await page.getByRole('option').count(),0);
   await page.close();
 });
 await test('pending details lose to all manual fields, new query/selection, blur, withdrawal, pickup, unmount',async()=>{
   for(const action of ['line1','city','postalCode','query','selection','blur','withdraw','shipping','unmount']){
     const {page}=await fresh();await query(page,'Pending');await page.evaluate(()=>window.mockDelayDetails=true);
     await page.getByRole('option').first().click();await page.waitForFunction(()=>!!window.mockPending.Pending);
     if(['line1','city','postalCode'].includes(action))await page.locator('input[name='+action+']').fill('Manual');
     if(action==='query'||action==='selection'){
       await page.evaluate(()=>window.mockDelayDetails=false);await query(page,'New');
       if(action==='selection'){await page.getByRole('option').first().click();await page.waitForFunction(()=>window.currentAddress.line1==='New0 12');}
     }
     if(action==='blur')await page.locator('input[name=name]').focus();
     if(action==='withdraw')await consent(page,'necessary');
     if(action==='shipping'||action==='unmount')await page.locator('#'+action).click();
     const before=await page.evaluate(()=>window.currentAddress);
     await page.evaluate(()=>window.mockPending.Pending.resolve());await page.waitForTimeout(50);
     assert.deepEqual(await page.evaluate(()=>window.currentAddress),before);
     await page.close();
   }
 });
 await test('SDK network/auth/timeout and late auth fail without retries or blocking manual edits',async()=>{
   for(const mode of ['network','auth','timeout','success']){
     const {page,requests}=await fresh('',mode);
     if(mode==='timeout')await page.clock.install();
     await line(page).fill('Failure');
     if(mode==='timeout'){await page.clock.fastForward(350);await page.waitForTimeout(30);await page.clock.fastForward(16000);}
     if(mode==='success'){await page.getByRole('option').first().waitFor();await page.evaluate(()=>window.gm_authFailure?.());}
     await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('manually'));
     assert.equal(await line(page).getAttribute('autocomplete'),'address-line1');
     await line(page).fill('Manual fallback');await page.waitForTimeout(400);assert.equal(requests(),1);assert.equal(await page.getByRole('option').count(),0);
     await page.close();
   }
 });
 await test('details timeout and abandoned sessions rotate tokens; cleanup ignores late SDK initialization',async()=>{
   const {page}=await fresh();await query(page,'Timed');await page.clock.install();await page.evaluate(()=>window.mockDelayDetails=true);
   await page.getByRole('option').first().click();await page.clock.fastForward(16000);
   await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('manually'));
   await page.evaluate(()=>window.mockPending.Timed.resolve());assert.equal(await line(page).inputValue(),'Timed');
   await page.evaluate(()=>window.mockDelayDetails=false);await line(page).fill('Again');await page.clock.fastForward(350);await page.getByRole('option').first().waitFor();
   const previous=await page.evaluate(()=>window.mockQueries.at(-1).sessionToken.id);
   await line(page).press('Escape');await line(page).fill('Fresh');await page.clock.fastForward(350);await page.getByRole('option').first().waitFor();
   assert.notEqual(await page.evaluate(()=>window.mockQueries.at(-1).sessionToken.id),previous);await page.close();
   const late=await fresh('','timeout');await line(late.page).fill('Late');await late.page.waitForTimeout(400);await late.page.locator('#unmount').click();
   await late.page.evaluate(()=>{window.google={maps:{importLibrary:async()=>{window.lateImport=true;return {}}}};document.querySelector('script[src*="maps.googleapis"]').dispatchEvent(new Event('load'));});
   await late.page.waitForTimeout(30);assert.equal(await late.page.getByRole('option').count(),0);assert.equal(await late.page.evaluate(()=>typeof window.gm_authFailure),'undefined');await late.page.close();
 });
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
if(failures)process.exitCode=1;
