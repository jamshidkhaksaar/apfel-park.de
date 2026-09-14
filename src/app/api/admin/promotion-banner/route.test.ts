import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks=vi.hoisted(()=>({user:vi.fn(),query:vi.fn(),settings:vi.fn(),campaign:vi.fn()}));
vi.mock('@/lib/admin-auth-server',()=>({createAdminServerClient:async()=>({auth:{getUser:async()=>({data:{user:mocks.user()}})}})}));
vi.mock('@/lib/db',()=>({query:mocks.query}));
vi.mock('@/lib/promotion-server',()=>({readPromotionSettings:mocks.settings,readPromotionCampaign:mocks.campaign}));
import {GET,PUT} from './route';
const id='11111111-1111-4111-8111-111111111111';
const request=(body:unknown,origin='https://apfel-park.de')=>new NextRequest('https://apfel-park.de/api/admin/promotion-banner',{method:'PUT',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();mocks.user.mockReturnValue({id:'staff',app_metadata:{role:'manager'}});mocks.query.mockResolvedValue({rows:[]});});
describe('promotion admin authorization and writes',()=>{
  it('denies anonymous and product-editor reads and writes',async()=>{
    for(const user of [null,{id:'editor',app_metadata:{role:'product_editor'}}]){
      mocks.user.mockReturnValue(user);expect((await GET()).status).toBe(401);expect((await PUT(request({enabled:false}))).status).toBe(401);
    }
    expect(mocks.query).not.toHaveBeenCalled();expect(mocks.settings).not.toHaveBeenCalled();
  });
  it('rejects cross-site mutation',async()=>{expect((await PUT(request({enabled:false},'https://evil.example'))).status).toBe(403);expect(mocks.query).not.toHaveBeenCalled();});
  it('blocks invalid campaign selection before writing',async()=>{
    expect((await PUT(request({enabled:true,campaignId:'bad'}))).status).toBe(400);
    mocks.campaign.mockResolvedValue({campaign:null,selectedCategories:[]});
    expect((await PUT(request({enabled:true,campaignId:id}))).status).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('can disable a banner even after the linked campaign is removed',async()=>{
    expect((await PUT(request({enabled:false,campaignId:id,headline:{de:'Aktion'}}))).status).toBe(200);
    expect(mocks.campaign).not.toHaveBeenCalled();expect(mocks.query).toHaveBeenCalledOnce();
    const saved=JSON.parse(mocks.query.mock.calls[0][1][0]);expect(saved.enabled).toBe(false);expect(saved.updatedBy).toBe('staff');
  });
});
