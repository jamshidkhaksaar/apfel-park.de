import Image from 'next/image';
import { notFound } from 'next/navigation';
import { readSessionUser } from '@/lib/session';
import { getOperationsAccess } from '@/lib/operations/access';
import { getPrintableAssets,getPrintableStock } from '@/lib/operations/documents';
import { uuidPattern } from '@/lib/operations/types';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { operationsDictionary } from '@/lib/admin-i18n';
import PrintButton from './PrintButton';

export const dynamic='force-dynamic';
export default async function LabelsPage({searchParams}:{searchParams:Promise<{ids?:string;inventory?:string}>}) {
  const access=await getOperationsAccess(await readSessionUser());if(!access?.owner) notFound();
  const params=await searchParams;const ids=(params.ids ?? '').split(',').filter(id=>uuidPattern.test(id)).slice(0,50);
  const inventories=(params.inventory ?? '').split(',').filter(id=>uuidPattern.test(id)).slice(0,50);
  if(!ids.length && !inventories.length) notFound();
  const assets=[...await getPrintableAssets(access,ids),...await getPrintableStock(access,inventories)];const locale=await getAdminLocale();
  return <main className="min-h-screen bg-white p-6 text-black">
    <style>{`@media print { @page { margin: 10mm; } .asset-label { break-inside: avoid; } }`}</style>
    <div className="mb-6 print:hidden"><h1 className="mb-3 text-xl font-semibold">{operationsDictionary[locale].labels}</h1><PrintButton label={operationsDictionary[locale].print}/></div>
    <div className="flex flex-wrap gap-4">{assets.map(asset=><article key={asset.id} className="asset-label w-80 rounded border border-neutral-300 p-3">
      <p className="text-xs font-semibold tracking-widest">APFEL PARK</p><h2 className="mt-1 text-sm font-semibold">{asset.title}</h2>
      <p className="mt-1 text-xs">{[asset.color,asset.storage].filter(Boolean).join(' · ')}</p>
      <Image src={`/api/admin/operations/${asset.label.startsWith('APS-') ? 'stock' : 'assets'}/${asset.id}/barcode`} alt={asset.label} width={290} height={100} unoptimized className="mt-2 h-auto w-full"/>
      <p className="mt-1 break-all text-xs">{asset.sku}</p>
    </article>)}</div>
  </main>;
}
