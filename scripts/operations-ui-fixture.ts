import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import path from 'node:path';

const main=async()=>{
  const bundle=await build({entryPoints:['scripts/operations-ui-client.tsx'],bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},
    plugins:[{name:'next-fixture-primitives',setup(builder){
      builder.onResolve({filter:/^next\/(link|image)$/},args=>({path:args.path,namespace:'fixture'}));
      builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='next/link'
        ? `import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children);}`
        : `import React from 'react';export default function Image({fill,unoptimized,...props}){return React.createElement('img',props);}`,loader:'js',resolveDir:process.cwd()}));
    }}]});
  const css=(await postcss([tailwindcss()]).process(await readFile('src/app/globals.css','utf8'),{from:path.resolve('src/app/globals.css')})).css;
  const branches=[{id:'00000000-0000-4000-8000-000000000001',code:'main',name:'Hamburg-Wilhelmsburg',address:'Test',active:true},
    {id:'00000000-0000-4000-8000-000000000002',code:'second',name:'Zweite Filiale (Test)',address:'Test',active:true}];
  const stock=[{inventoryId:'00000000-0000-4000-8000-000000000010',productId:'00000000-0000-4000-8000-000000000011',sku:'TEST-IP12-128',title:'Apple iPhone 12 · Schwarz · 128 GB',category:'Smartphones',condition:'used',image:null,priceCents:25900,branchId:branches[0].id,branchName:branches[0].name,onHand:3,reserved:1,available:2,minimum:2,target:5,missingCosts:1},
    {inventoryId:'00000000-0000-4000-8000-000000000012',productId:'00000000-0000-4000-8000-000000000013',sku:'TEST-CABLE',title:'TRUSMI USB-C Ladekabel · 1 m',category:'Accessories',condition:'sealed',image:null,priceCents:1490,branchId:branches[0].id,branchName:branches[0].name,onHand:10,reserved:0,available:10,minimum:2,target:10,missingCosts:0}];
  const overview={units:12,reserved:1,lowStock:1,outOfStock:0,missingCosts:1,capturedCents:25900,refundedCents:0,revenueCents:25900,shippingIncomeCents:499,shippingExpenseCents:420,feesCents:680,overheadCents:0,purchasesCents:100000,unitsSold:1,orders:1,partialRefundsUnknown:0,knownCostCents:0,costUnits:0,stockValueCents:55000,contributionCents:null,outputVatCents:4135,inputVatCents:0,taxEstimateCents:null,incompleteExpenses:0,windowStart:'2026-10-01',windowEnd:'2026-10-04',historicalCostGap:true,missingPaymentFees:0,unpricedShopUnits:0};
  const documents:Record<string,unknown>[]=[];
  const server=createServer(async(req,res)=>{
    const url=new URL(req.url ?? '/','http://127.0.0.1');
    if(url.pathname==='/fixture.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);return;}
    if(url.pathname==='/fixture.css'){res.setHeader('Content-Type','text/css');res.end(css);return;}
    if(url.pathname.startsWith('/fonts/')) {try {res.end(await readFile(path.join('public',url.pathname)));}catch {res.statusCode=404;res.end();}return;}
    if(url.pathname==='/api/admin/operations/events'){
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store'});res.write('id: 1\ndata: {"changed":true}\n\n');
      const timer=setInterval(()=>res.write('data: {"changed":true}\n\n'),4000);req.on('close',()=>clearInterval(timer));return;
    }
    if(url.pathname==='/api/admin/operations'){
      res.setHeader('Content-Type','application/json');
      if(req.method==='POST'){
        let raw='';for await(const chunk of req) raw+=String(chunk);
        const body=JSON.parse(raw);const doc={id:'00000000-0000-4000-8000-000000000099',number:1,kind:body.action,status:'training',branch_id:branches[0].id,destination_id:null,created_at:new Date().toISOString(),payload:{}};
        documents.unshift(doc);res.end(JSON.stringify(doc));return;
      }
      const view=url.searchParams.get('view');const q=(url.searchParams.get('q') ?? '').toLowerCase();
      const data=view==='bootstrap' ? {owner:true,branches,settings:{users:[{id:'00000000-0000-4000-8000-000000000003',email:'staff@example.invalid',role:'cashier'}],members:[],identifierStorageReady:true}} :
        view==='stock' ? {items:stock.filter(s=>!q || (s.title+' '+s.sku).toLowerCase().includes(q)),total:2} :
        view==='overview' ? overview : view==='documents' ? {documents} : view==='orders' ? {orders:[]} :
        view==='assets' ? {assets:[{id:'00000000-0000-4000-8000-000000000014',label:'APF-00000024',inventoryId:stock[0].inventoryId,branchId:branches[0].id,title:stock[0].title,sku:stock[0].sku,state:'available',color:'Schwarz',storage:'128 GB',batteryHealth:88,costGrossCents:null,costNetCents:null,identifierRecorded:false}]} : {asset:null};
      res.end(JSON.stringify(data));return;
    }
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><html lang="de" data-theme="${url.searchParams.get('theme')==='dark'?'dark':'mono'}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><title>Kasse & Lager - isolated UI fixture</title></head><body><p style="padding:8px;font-size:12px">ISOLATED UI TEST - synthetic data only</p><div id="root" style="padding:16px"></div><script src="/fixture.js"></script></body></html>`);
  });
  const port=Number(process.env.OPS_UI_PORT ?? 3118);if(port===3000) throw new Error('Never use the production port');
  server.listen(port,'127.0.0.1',()=>process.stdout.write(`Operations fixture listening on ${port}\n`));
};
void main();
