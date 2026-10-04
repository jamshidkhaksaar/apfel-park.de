import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { readSessionUserFromRequest } from '@/lib/session';
import { getOperationsAccess } from '@/lib/operations/access';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request: NextRequest) {
  const access=await getOperationsAccess(await readSessionUserFromRequest(request));
  if (!access) return NextResponse.json({error:'Unauthorized'},{status:401});
  const rawCursor=request.headers.get('last-event-id') ?? '0';
  let cursor=/^\d{1,18}$/.test(rawCursor) ? BigInt(rawCursor) : BigInt(0);
  const encoder=new TextEncoder();let stopped=false;let timer: ReturnType<typeof setTimeout>|undefined;
  let sentInitial=false;
  const stream=new ReadableStream<Uint8Array>({
    async start(controller) {
      const started=Date.now();
      const send=(text:string) => { if (!stopped) controller.enqueue(encoder.encode(text)); };
      const close=() => { if (!stopped) { stopped=true;if(timer) clearTimeout(timer);controller.close(); } };
      request.signal.addEventListener('abort',close,{once:true});
      send('retry: 3000\n\n');
      const tick=async () => {
        if(stopped) return;
        try {
          if (Date.now()-started>45000) { close();return; }
          const current=await getOperationsAccess(await readSessionUserFromRequest(request));
          if (!current || current.owner!==access.owner || current.branchId!==access.branchId) { close();return; }
          const result=await query(`SELECT coalesce(max(id),0)::text AS latest FROM ops_events
            WHERE ($1::uuid IS NULL OR branch_id=$1 OR branch_id IS NULL)`, [access.owner ? null : access.branchId]);
          const latest=BigInt(result.rows[0].latest);
          if (latest>cursor || !sentInitial) {sentInitial=true;cursor=latest;send(`id: ${latest}\ndata: {"changed":true}\n\n`); }
          else send(': heartbeat\n\n');
          timer=setTimeout(()=>void tick(),2000);
        } catch { close(); }
      };
      await tick();
    },
    cancel() { stopped=true;if(timer) clearTimeout(timer); },
  });
  return new NextResponse(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'private, no-store','X-Accel-Buffering':'no'}});
}
