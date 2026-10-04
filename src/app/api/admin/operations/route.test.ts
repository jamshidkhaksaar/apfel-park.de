import { beforeEach,it,expect,vi } from 'vitest';
import { NextRequest,NextResponse } from 'next/server';
const mocks=vi.hoisted(()=>({access:vi.fn(),owner:vi.fn(),csrf:vi.fn(),write:vi.fn(),stock:vi.fn(),overview:vi.fn()}));
vi.mock('@/lib/session',()=>({readSessionUserFromRequest:async()=>({email:'test@example.invalid'})}));
vi.mock('@/lib/operations/access',()=>({getOperationsAccess:mocks.access,requireOperationsOwner:mocks.owner}));
vi.mock('@/lib/admin-csrf',()=>({rejectCrossSiteAdminMutation:mocks.csrf}));
vi.mock('@/lib/operations/read',()=>({branchFilter:()=>null,operationsBranches:async()=>[],readOperationsSettings:async()=>({}),readOperationsAssets:async()=>[],readOperationsDocuments:async()=>[],readOperationsStock:mocks.stock,readOperationsOverview:mocks.overview}));
vi.mock('@/lib/operations/write',()=>({writeOperations:mocks.write,lookupScannedAsset:async()=>null}));
import { GET,POST } from './route';
const request=(body:unknown)=>new NextRequest('https://apfel-park.de/api/admin/operations',{method:'POST',body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();mocks.access.mockResolvedValue({owner:true,userId:'test'});mocks.csrf.mockReturnValue(null);mocks.owner.mockImplementation(()=>{});mocks.write.mockResolvedValue({id:'document'});});
it('rejects unauthenticated reads and writes',async()=>{
  mocks.access.mockResolvedValue(null);expect((await GET(new NextRequest('https://apfel-park.de/api/admin/operations'))).status).toBe(401);
  expect((await POST(request({action:'purchase'}))).status).toBe(401);expect(mocks.write).not.toHaveBeenCalled();
});
it('checks owner permission before any financial mutation',async()=>{
  mocks.owner.mockImplementation(()=>{throw new Error('owner_required');});
  expect((await POST(request({action:'purchase'}))).status).toBe(403);expect(mocks.write).not.toHaveBeenCalled();
});
it('prevents a cashier financial read',async()=>{
  mocks.owner.mockImplementation(()=>{throw new Error('owner_required');});
  expect((await GET(new NextRequest('https://apfel-park.de/api/admin/operations?view=overview'))).status).toBe(403);expect(mocks.overview).not.toHaveBeenCalled();
});
it('rejects cross-site requests before processing a sale',async()=>{
  mocks.csrf.mockReturnValue(NextResponse.json({},{status:403}));
  expect((await POST(request({action:'training_sale'}))).status).toBe(403);expect(mocks.write).not.toHaveBeenCalled();
});
it('does not give live checkout a bypass around fiscal setup',async()=>{
  mocks.write.mockRejectedValue(new Error('fiscal_not_configured'));
  expect((await POST(request({action:'live_sale'}))).status).toBe(409);
});
it('never exposes a database error or submitted identifier',async()=>{
  mocks.write.mockRejectedValue(new Error('duplicate key serial_encrypted PRIVATE_IDENTIFIER'));
  const response=await POST(request({action:'asset_update'}));expect(await response.json()).toEqual({error:'operations_failed'});
});
it('validates malformed JSON objects',async()=>{
  expect((await POST(request(null))).status).toBe(400);expect((await POST(request([]))).status).toBe(400);expect(mocks.write).not.toHaveBeenCalled();
});
