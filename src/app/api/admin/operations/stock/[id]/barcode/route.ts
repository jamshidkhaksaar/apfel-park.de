import { NextRequest,NextResponse } from 'next/server';
import { readSessionUserFromRequest } from '@/lib/session';
import { getOperationsAccess } from '@/lib/operations/access';
import { getPrintableStock,renderAssetBarcode } from '@/lib/operations/documents';
import { uuidPattern } from '@/lib/operations/types';
export const runtime='nodejs';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const access=await getOperationsAccess(await readSessionUserFromRequest(request));
  if(!access?.owner) return NextResponse.json({error:'Unauthorized'},{status:403});
  const {id}=await params;if(!uuidPattern.test(id)) return NextResponse.json({error:'invalid_reference'},{status:400});
  const [item]=await getPrintableStock(access,[id]);if(!item) return NextResponse.json({error:'not_found'},{status:404});
  return new NextResponse(renderAssetBarcode(item.label),{headers:{'Content-Type':'image/svg+xml','Cache-Control':'private, no-store',
    'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"}});
}
