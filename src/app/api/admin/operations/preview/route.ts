import { NextRequest, NextResponse } from 'next/server';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { readSessionUserFromRequest } from '@/lib/session';
import { getOperationsAccess } from '@/lib/operations/access';
import { operationsError, operationsHeaders, parseOperationsBody } from '@/lib/operations/api-errors';
import { previewOperations } from '@/lib/operations/preview';

export async function POST(request:NextRequest) {
  try {
    const access=await getOperationsAccess(await readSessionUserFromRequest(request));
    if(!access) return NextResponse.json({error:'Unauthorized'},{status:401,headers:operationsHeaders});
    const csrf=rejectCrossSiteAdminMutation(request);if(csrf) return csrf;
    return NextResponse.json(await previewOperations(access,await parseOperationsBody(request)),{headers:operationsHeaders});
  }catch(error){return operationsError(error);}
}
