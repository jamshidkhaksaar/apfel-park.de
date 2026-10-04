import { NextRequest, NextResponse } from 'next/server';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { readSessionUserFromRequest } from '@/lib/session';
import { getOperationsAccess, requireOperationsOwner } from '@/lib/operations/access';
import { branchFilter, operationsBranches, readOperationsAssets, readOperationsDocuments, readOperationsOverview, readOperationsSettings, readOperationsStock,readOperationsOrders } from '@/lib/operations/read';
import { lookupScannedAsset, writeOperations } from '@/lib/operations/write';

const headers={ 'Cache-Control':'private, no-store' };
const errorResponse = (error: unknown) => {
  const message=error instanceof Error ? error.message : 'operations_failed';
  const status=/owner_required|branch_forbidden|price_override_forbidden/.test(message) ? 403 :
    message==='fiscal_not_configured' || message==='idempotency_conflict' ? 409 :
    /invalid_|required|not_found|insufficient|unavailable|not_sellable|inactive|not_receivable|not_configured/.test(message) ? 400 : 500;
  // Never return SQL error text, submitted identifiers or credentials.
  const known=/^[a-z_]{3,80}$/.test(message) ? message : 'operations_failed';
  if (status===500) console.error('[Operations] request failed');
  return NextResponse.json({ error:known },{ status,headers });
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
    let data: unknown;
    if (view==='bootstrap') data={branches:await operationsBranches(access),owner:access.owner,branchId:access.branchId,settings:await readOperationsSettings(access)};
    else if (view==='stock') data=await readOperationsStock(access,branchId,params.get('q') ?? '',page);
    else if (view==='assets') data={assets:await readOperationsAssets(access,branchId,params.get('q') ?? '',page)};
    else if (view==='documents') data={documents:await readOperationsDocuments(access,branchId)};
    else if (view==='orders') data={orders:await readOperationsOrders(access)};
    else if (view==='scan') data={asset:await lookupScannedAsset(access,branchId ?? '',params.get('q') ?? '')};
    else if (view==='overview') {
      requireOperationsOwner(access);
      data=await readOperationsOverview(access,branchId,params.get('from') ?? '',params.get('to') ?? '');
      if (params.get('format')==='csv') {
        const report=data as Record<string,unknown>;
        const csv='metric,value\r\n'+Object.entries(report).map(([key,value])=>`"${key}","${String(value).replaceAll('"','""')}"`).join('\r\n');
        return new NextResponse('\uFEFF'+csv,{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="apfel-park-report.csv"'}});
      }
    } else return NextResponse.json({error:'invalid_view'},{status:400,headers});
    return NextResponse.json(data,{headers});
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: NextRequest) {
  try {
    const access=await getOperationsAccess(await readSessionUserFromRequest(request));
    if (!access) return NextResponse.json({error:'Unauthorized'},{status:401,headers});
    const csrf=rejectCrossSiteAdminMutation(request);if (csrf) return csrf;
    const raw=await request.text();if (raw.length>100000) return NextResponse.json({error:'invalid_payload'},{status:413,headers});
    let body: unknown;try { body=JSON.parse(raw); } catch { return NextResponse.json({error:'invalid_payload'},{status:400,headers}); }
    if (!body || typeof body!=='object' || Array.isArray(body)) return NextResponse.json({error:'invalid_payload'},{status:400,headers});
    const payload=body as Record<string,unknown>;
    if (payload.action!=='training_sale') requireOperationsOwner(access);
    return NextResponse.json(await writeOperations(access,payload),{headers});
  } catch (error) { return errorResponse(error); }
}
