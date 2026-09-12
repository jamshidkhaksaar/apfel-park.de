// Synthetic loopback HTTP only. Actual browser adapter, Shell, React/providers and CSS.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/root/apfel-audit/browser/node_modules/playwright');
const root = new URL('../', import.meta.url).pathname;
const bundle = await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Shell from './src/components/admin/AdminShell';import {AdminProvider} from './src/lib/admin-context';import ThemeProvider from './src/components/ThemeProvider';import {createAdminBrowserClient} from './src/lib/admin-auth-client';window.signOut=()=>createAdminBrowserClient().auth.signOut();window.pushes=[];window.refreshes=0;createRoot(document.getElementById('root')).render(<ThemeProvider><AdminProvider user={{email:'fixture@example.invalid',role:'admin'}}><Shell title="Fixture"><p>Authenticated fixture content</p></Shell></AdminProvider></ThemeProvider>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'routing-only',setup(b){b.onResolve({filter:/^next\/(navigation|link)$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({resolveDir:root,loader:'tsx',contents:a.path.endsWith('navigation')?`export const usePathname=()=>'/admin';export const useRouter=()=>({push:p=>window.pushes.push(p),refresh:()=>window.refreshes++,prefetch:()=>{}});`:`import React from 'react';export default function Link({prefetch,children,...props}){return <a {...props}>{children}</a>}` }));}}]});
const cssFile=root+'src/app/globals.css';
const css=(await postcss([tailwind({base:root})]).process(await readFile(cssFile,'utf8'),{from:cssFile})).css;
let status=500;
const server=createServer((req,res)=>{
 if(req.url==='/entry.js'){res.setHeader('Content-Type','text/javascript');return res.end(bundle.outputFiles[0].contents);}
 if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');return res.end(css);}
 if(req.url==='/api/admin/logout'){res.statusCode=status;if(status===200)res.setHeader('Set-Cookie','apfel_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');return res.end('{}');}
 if(req.url==='/api/admin/badges'){res.setHeader('Content-Type','application/json');return res.end('{"chat":0,"orders":0,"repairs":0}');}
 if(req.url.startsWith('/api/')){res.statusCode=400;return res.end('Unhandled synthetic API');}
 res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/entry.js"></script></body></html>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const observations=[];
try {
 for(const width of [390,1280]) for(const lang of ['en','de']) for(const mode of ['http500','http403','network']) {
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.addCookies([{name:'apfel_admin_session',value:'synthetic-auth-cookie',url,httpOnly:true,sameSite:'Lax'},{name:'admin-lang',value:lang,url}]);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===url?route.continue():route.abort());
  try {
   status=mode==='http403'?403:500;
   if(mode==='network')await page.route('**/api/admin/logout',route=>route.abort('failed'));
   await page.goto(url);await page.getByText('Authenticated fixture content').waitFor();
   const rejected=await page.evaluate(async()=>{try{await window.signOut();return false;}catch{return true;}});
   assert.equal(rejected,true,'actual browser adapter must reject failure');
   if(width===390)await page.getByRole('button',{name:'Open navigation menu'}).click();
   const logout=page.getByRole('button',{name:lang==='de'?'Abmelden':'Logout',exact:true}).first();
   await logout.click();
   const alert=page.getByRole('alert');await alert.waitFor({timeout:2500});
   assert.match(await alert.innerText(),lang==='de'?/nicht.*abgemeldet/i:/not.*logged out/i);
   assert.deepEqual(await page.evaluate(()=>window.pushes),[],'no false success navigation');
   assert.equal(await page.evaluate(()=>window.refreshes),0,'no success refresh');
   assert.equal((await context.cookies()).some(c=>c.name==='apfel_admin_session'),true,'failure preserves login cookie');
   assert.equal(await logout.isEnabled(),true,'logout can be retried');
   if(mode==='network')await page.unroute('**/api/admin/logout');
   status=200;
   await logout.focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>window.pushes.length===1);
   assert.deepEqual(await page.evaluate(()=>window.pushes),['/login']);
   assert.equal(await page.evaluate(()=>window.refreshes),1);
   assert.equal((await context.cookies()).some(c=>c.name==='apfel_admin_session'),false);
   assert.deepEqual(errors,[]);
   observations.push({width,lang,mode,result:'pass'});
  } catch(e){observations.push({width,lang,mode,result:'fail',message:e.message,errors});}
  finally{await context.close();}
 }
 console.log(JSON.stringify(observations,null,2));
 assert.equal(observations.filter(o=>o.result==='fail').length,0);
} finally {await browser.close();await new Promise(r=>server.close(r));}
