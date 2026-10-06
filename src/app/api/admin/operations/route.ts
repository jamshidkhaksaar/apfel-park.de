import { NextRequest, NextResponse } from 'next/server';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { readSessionUserFromRequest } from '@/lib/session';
import { getOperationsAccess, requireOperationsOwner } from '@/lib/operations/access';
import { branchFilter, operationsBranches, readOperationsAssetPage, readOperationsDocumentPage, readOperationsOverview, readOperationsDashboard, readOperationsReport, readOperationsExpenses, readOperationsSettings, readOperationsStock,readOperationsOrders } from '@/lib/operations/read';
import { lookupScannedAsset, writeOperations } from '@/lib/operations/write';
import { operationsError, parseOperationsBody } from '@/lib/operations/api-errors';
import { readOperationsHealth } from '@/lib/operations/health';
import { readOrderExport } from '@/lib/operations/report';

const headers={ 'Cache-Control':'private, no-store' };
const csvResponse=(rows:Record<string,unknown>[])=>{
  const columns=Object.keys(rows[0] ?? {});const cell=(value:unknown)=>'"'+String(value ?? '').replaceAll('"','""')+'"';
  const csv=[columns.map(cell).join(','),...rows.map(row=>columns.map(key=>cell(row[key] instanceof Date ? (row[key] as Date).toISOString():row[key])).join(','))].join('\r\n');
  return new NextResponse('\uFEFF'+csv,{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="apfel-park-report.csv"'}});
};
export async function GET(request: NextRequest) {
  try {
    const access=await getOperationsAccess(await readSessionUserFromRequest(request));
    if (!access) return NextResponse.json({error:'Unauthorized'},{status:401,headers});
    const params=request.nextUrl.searchParams;
    const branchId=branchFilter(access,params.get('branchId'));
    const pageInput=Number(params.get('page') ?? 1);
    const page=Number.isSafeInteger(pageInput) && pageInput>0 && pageInput<=10000 ? pageInput : 1;
    const view=params.get('view') ?? 'bootstrap';
    const options={page,kind:params.get('kind') ?? '',status:params.get('status') ?? '',from:params.get('from') ?? '',to:params.get('to') ?? '',filter:params.get('filter') ?? '',q:params.get('q') ?? '',category:params.get('category') ?? ''};
    let data: unknown;
    if (view==='bootstrap') data={branches:await operationsBranches(access),owner:access.owner,branchId:access.branchId,settings:await readOperationsSettings(access)};
    else if (view==='stock') data=await readOperationsStock(access,branchId,options.q,page,options);
    else if (view==='assets') data=await readOperationsAssetPage(access,branchId,options.q,page,options);
    else if (view==='documents') data=await readOperationsDocumentPage(access,branchId,options);
    else if (view==='orders') {
      requireOperationsOwner(access);
      if(params.get('format')==='csv') return csvResponse(await readOrderExport(access,branchId,options.from,options.to));
      data=await readOperationsOrders(access,branchId,options);
    }
    else if(view==='expenses') data=await readOperationsExpenses(access,branchId,options);
    else if(view==='health') data=await readOperationsHealth(access);
    else if(view==='reports') {
      requireOperationsOwner(access);const report=await readOperationsReport(access,branchId,options.from,options.to);
      if(params.get('format')==='csv') return csvResponse(Object.entries(report.summary).map(([metric,value])=>({metric,value})));
      data=report;
    }
    else if (view==='scan') data={asset:await lookupScannedAsset(access,branchId ?? '',params.get('q') ?? '')};
    else if (view==='overview') {
      requireOperationsOwner(access);
      data=options.from && options.to ? await readOperationsOverview(access,branchId,options.from,options.to):await readOperationsDashboard(access,branchId);
      if (params.get('format')==='csv') {
        const report=data as Record<string,unknown>;
        const csv='metric,value\r\n'+Object.entries(report).map(([key,value])=>`"${key}","${String(value).replaceAll('"','""')}"`).join('\r\n');
        return new NextResponse('\uFEFF'+csv,{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="apfel-park-report.csv"'}});
      }
    } else return NextResponse.json({error:'invalid_view'},{status:400,headers});
    return NextResponse.json(data,{headers});
  } catch (error) { return operationsError(error); }
}
export async function POST(request: NextRequest) {
  try {
    const access=await getOperationsAccess(await readSessionUserFromRequest(request));
    if (!access) return NextResponse.json({error:'Unauthorized'},{status:401,headers});
    const csrf=rejectCrossSiteAdminMutation(request);if (csrf) return csrf;
    const payload=await parseOperationsBody(request);
    if (payload.action!=='training_sale') requireOperationsOwner(access);
    return NextResponse.json(await writeOperations(access,payload),{headers});
  } catch (error) { return operationsError(error); }
}
