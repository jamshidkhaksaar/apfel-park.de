import { mkdir,writeFile } from 'node:fs/promises';
import { renderTrainingReceipt,renderAssetBarcode } from '../src/lib/operations/documents';
const main=async()=>{
  await mkdir('output/pdf',{recursive:true});
  const pdf=await renderTrainingReceipt({number:24,created_at:'2026-10-04T12:00:00Z',payload:{branchName:'Hamburg-Wilhelmsburg',totalCents:30370,
    lines:[{inventoryId:'test',sku:'TEST-IP12-128',title:'Apple iPhone 12 · Schwarz · 128 GB',condition:'Gebraucht',quantity:1,unitCents:25900,totalCents:25900},
      {inventoryId:'test-2',sku:'TEST-CABLE',title:'TRUSMI USB-C Ladekabel · 1 m',condition:'Neu',quantity:3,unitCents:1490,totalCents:4470}]}});
  await writeFile('output/pdf/operations-training-receipt.pdf',pdf);
  await writeFile('output/pdf/operations-label.svg',renderAssetBarcode('APF-00000024'));
  process.stdout.write('Synthetic operations document previews generated\n');
};
void main();
