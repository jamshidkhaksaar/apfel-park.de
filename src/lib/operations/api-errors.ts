import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

export const operationsHeaders={'Cache-Control':'private, no-store'};
export const operationsError=(error:unknown) => {
  const requestId=randomUUID();const message=error instanceof Error ? error.message:'operations_failed';
  const sqlstate=error && typeof error==='object' && 'code' in error ? String(error.code):'';
  const retryable=['40P01','40001','57014','55P03','ECONNRESET','ETIMEDOUT'].includes(sqlstate);
  const code=retryable ? 'temporarily_unavailable':/^[a-z_]{3,80}$/.test(message) ? message:'operations_failed';
  const status=retryable ? 503:/owner_required|branch_forbidden|price_override_forbidden|cannot_revoke/.test(code) ? 403:
    /stale_information|confirmation_|idempotency_conflict|fiscal_not_configured/.test(code) ? 409:
    /invalid_|required|not_found|insufficient|unavailable|not_sellable|inactive|not_receivable|not_configured|blocked/.test(code) ? 400:500;
  if(status>=500) console.error('[operations]',JSON.stringify({requestId,code,sqlstate:/^[0-9A-Z]{5}$/.test(sqlstate) ? sqlstate:undefined}));
  return NextResponse.json({error:code,requestId},{status,headers:{...operationsHeaders,'X-Request-ID':requestId}});
};
export const parseOperationsBody=async(request:Request):Promise<Record<string,unknown>> => {
  const raw=await request.text();if(raw.length>100000) throw new Error('invalid_payload');
  let body:unknown;try{body=JSON.parse(raw);}catch{throw new Error('invalid_payload');}
  if(!body || typeof body!=='object' || Array.isArray(body)) throw new Error('invalid_payload');return body as Record<string,unknown>;
};
