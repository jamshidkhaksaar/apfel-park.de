import { NextRequest,NextResponse } from 'next/server';
import { readSessionUserFromRequest } from '@/lib/session';
import { getOperationsAccess } from '@/lib/operations/access';
import { readTrainingDocument,renderTrainingReceipt } from '@/lib/operations/documents';
import { uuidPattern } from '@/lib/operations/types';

export const runtime='nodejs';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const access=await getOperationsAccess(await readSessionUserFromRequest(request));
  if(!access) return NextResponse.json({error:'Unauthorized'},{status:401});
  const {id}=await params;if(!uuidPattern.test(id)) return NextResponse.json({error:'invalid_reference'},{status:400});
  const document=await readTrainingDocument(access,id);if(!document) return NextResponse.json({error:'not_found'},{status:404});
  const pdf=await renderTrainingReceipt(document);
  return new NextResponse(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Cache-Control':'private, no-store',
    'Content-Disposition':`inline; filename="apfel-park-training-${document.number}.pdf"`}});
}
