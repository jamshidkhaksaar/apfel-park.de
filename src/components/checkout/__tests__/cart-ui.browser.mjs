import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/root/apfel-audit/browser/node_modules/playwright');
let browser, server, origin;
const stored = [{ productId: 'fixture-phone', variantColor: 'Blue', variantStorage: '256 GB', quantity: 2 }];
const cart = { currency: 'EUR', subtotalAmount: 1234.56, items: [{ key: 'fixture', title: 'Fixture phone Blue 256 GB', slug: 'fixture', quantity: 2, unitAmount: 617.28, lineAmount: 1234.56 }] };
before(async () => {
  const bundle = await build({
    stdin: { contents: `import React, {useState, useCallback} from 'react';
      import {createRoot} from 'react-dom/client';
      import MiniCart from './src/components/checkout/MiniCart';
      import QuickAdd from './src/components/store/StoreQuickAddDrawer';
      const product = {id:'fixture', title:'Fixture phone', price:100, stock:9, variants:[
        {color:'Blue',storage:'128 GB',price:111,stock:2,sku:'blue-128'},
        {color:'Blue',storage:'256 GB',price:222,stock:3,sku:'blue-256'},
        {color:'Red',storage:'512 GB',price:333,stock:1,sku:'red-512'},
        {color:'Sold out',storage:'1 TB',price:444,stock:0,sku:'none'}]};
      function App(){const [open,setOpen]=useState(false); const close=useCallback(()=>setOpen(false),[]);
        const locale=new URLSearchParams(location.search).get('locale') || 'en';
        return <><button id="mini" onClick={()=>window.dispatchEvent(new Event('apfel-cart-open'))}>Open mini</button>
          <button id="quick" onClick={()=>setOpen(true)}>Open quick</button><MiniCart locale={locale}/>
          <QuickAdd product={product} locale={locale} open={open} onClose={close} onConfirm={v=>window.confirmed=v}/></>;}
      createRoot(document.getElementById('root')).render(<App/>);`, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, format: 'iife', jsx: 'automatic', plugins: [{ name: 'next-fixture', setup(b) {
      b.onResolve({filter:/^next\/(image|link)$/}, a=>({path:a.path,namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'}, a=>({resolveDir:process.cwd(),loader:'jsx',contents: a.path.endsWith('link') ? `import React from 'react'; export default function Link(p){return <a {...p}/>}` : `import React from 'react'; export default function Image({fill,unoptimized,...p}){return <img {...p}/>}` }));
    }}],
  });
  server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:'<!doctype html><html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});
async function pageFor(locale='en', items=stored){const page=await browser.newPage(); await page.addInitScript(({items})=>localStorage.setItem('apfel-cart-v1',JSON.stringify(items)),{items}); await page.goto(`${origin}/?locale=${locale}`); return page;}

test('MiniCart distinguishes loading and truly empty carts', async()=>{
  for(const locale of ['en','de']){
    const empty=await pageFor(locale,[]);let calls=0;await empty.route('**/api/cart/validate',r=>{calls++;return r.abort();});
    await empty.locator('#mini').click();await empty.getByText(locale==='en'?'Your cart is empty.':'Dein Warenkorb ist leer.',{exact:true}).waitFor();assert.equal(calls,0);assert.equal(await empty.getByRole('alert').count(),0);await empty.close();
    const page=await pageFor(locale);let release;await page.route('**/api/cart/validate',async r=>{await new Promise(resolve=>release=resolve);await r.fulfill({json:{success:true,cart}});});
    await page.locator('#mini').click();await page.getByRole('status').waitFor();
    assert.equal(await page.getByText(locale==='en'?'Your cart is empty.':'Dein Warenkorb ist leer.',{exact:true}).count(),0);
    assert.equal(await page.getByRole('link',{name:locale==='en'?'Checkout':'Zur Kasse',exact:true}).count(),0);
    release();await page.getByText('Fixture phone Blue 256 GB',{exact:true}).waitFor();await page.close();
  }
});

test('MiniCart closed requests cannot replace the state on reopening', async()=>{
  const page=await pageFor();let release;let calls=0;
  await page.route('**/api/cart/validate',async r=>{calls++;if(calls===1){await new Promise(resolve=>release=resolve);return r.fulfill({json:{success:true,cart}});}return r.fulfill({status:503,json:{success:false}});});
  await page.locator('#mini').click();await page.getByRole('status').waitFor();await page.keyboard.press('Escape');
  release();await page.waitForTimeout(100);await page.locator('#mini').click();await page.getByRole('alert').waitFor();
  assert.equal(await page.getByText('Fixture phone Blue 256 GB',{exact:true}).count(),0);await page.close();
});

test('QuickAdd native keyboard selects exact variants, resets dependent storage and preserves prices', async()=>{
  for(const locale of ['en','de']){
    const page=await pageFor(locale);await page.locator('#quick').click();
    const blue=page.getByRole('radio',{name:'Blue',exact:true});await blue.focus();
    await page.keyboard.press('ArrowRight');
    const red=page.getByRole('radio',{name:'Red',exact:true});
    assert.equal(await red.evaluate(el=>el===document.activeElement),true);
    assert.equal(await red.isChecked(),true);
    assert.equal(await page.getByRole('radio',{name:'512 GB',exact:true}).isChecked(),true);
    assert.match(await page.getByRole('dialog').innerText(),/333/);
    await page.keyboard.press('ArrowDown');assert.equal(await blue.isChecked(),true);
    await page.keyboard.press('ArrowLeft');assert.equal(await red.isChecked(),true);
    await page.keyboard.press('ArrowUp');assert.equal(await blue.isChecked(),true);
    await page.keyboard.press('Tab');
    const small=page.getByRole('radio',{name:'128 GB',exact:true});
    assert.equal(await small.evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('ArrowRight');
    const large=page.getByRole('radio',{name:'256 GB',exact:true});
    assert.equal(await large.isChecked(),true);await page.keyboard.press('Space');
    assert.match(await page.getByRole('dialog').innerText(),/222/);
    assert.equal(await page.getByRole('radio',{name:'Sold out',exact:true}).count(),0);
    await page.keyboard.press('Tab');const add=page.getByRole('button',{name:locale==='en'?'Add to cart':'In den Warenkorb',exact:true});
    assert.equal(await add.evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>window.confirmed),{color:'Blue',storage:'256 GB',price:222,stock:3,sku:'blue-256'});
    await page.keyboard.press('Escape');await page.locator('#quick').waitFor();
    await page.waitForFunction(()=>document.activeElement?.id==='quick');
    await page.locator('#quick').click();assert.equal(await small.isChecked(),true);
    await page.close();
  }
});

test('MiniCart validation failure is announced, retains client selection and retries exact request', async()=>{
  for(const locale of ['en','de']) for(const failure of ['http','network','json','unsuccessful']){
    const page=await pageFor(locale);const requests=[];let fail=true;
    await page.route('**/api/cart/validate',async route=>{requests.push(route.request().postDataJSON());if(fail){if(failure==='network')return route.abort();return route.fulfill({status:failure==='http'?503:200,contentType:'application/json',body:failure==='json'?'not json':JSON.stringify({success:false})});}return route.fulfill({json:{success:true,cart}});});
    await page.locator('#mini').click();
    const alert=page.getByRole('alert');await alert.waitFor({timeout:1500});
    assert.match(await alert.innerText(),locale==='en'?/could not|unable|unavailable/i:/nicht|fehl/i);
    assert.equal(await page.getByText(locale==='en'?'Your cart is empty.':'Dein Warenkorb ist leer.',{exact:true}).count(),0);
    assert.equal(await page.getByText(locale==='en'?'Added to cart':'Zum Warenkorb hinzugefügt',{exact:true}).count(),0);
    assert.equal(await page.getByRole('link',{name:locale==='en'?'View cart':'Warenkorb ansehen'}).getAttribute('href'),`/${locale}/cart`);
    assert.deepEqual(JSON.parse(await page.evaluate(()=>localStorage.getItem('apfel-cart-v1'))),stored);
    fail=false;await page.getByRole('button',{name:locale==='en'?'Retry':'Erneut versuchen',exact:true}).click();
    await page.getByText('Fixture phone Blue 256 GB',{exact:true}).waitFor();assert.equal(await alert.count(),0);
    assert.deepEqual(requests,[{items:stored,shippingMethod:'pickup'},{items:stored,shippingMethod:'pickup'}]);
    assert.match(await page.getByRole('dialog').innerText(),locale==='en'?/€1,234\.56/:/1\.234,56/);
    await page.close();
  }
});
