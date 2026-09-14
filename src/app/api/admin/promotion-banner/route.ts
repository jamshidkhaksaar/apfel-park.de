import { NextRequest, NextResponse } from 'next/server';
import { canManageCampaigns } from '@/lib/admin-auth';
import { createAdminServerClient } from '@/lib/admin-auth-server';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { query } from '@/lib/db';
import { promotionCampaignIssue, sanitizePromotionSettings } from '@/lib/promotion';
import { readPromotionCampaign, readPromotionSettings } from '@/lib/promotion-server';
const user=async()=>{const client=await createAdminServerClient();return (await client.auth.getUser()).data.user;};
const headers={'Cache-Control':'no-store'};
export async function GET(){
  if(!canManageCampaigns(await user()))return NextResponse.json({error:'Unauthorized'},{status:401,headers});
  try{return NextResponse.json({success:true,settings:await readPromotionSettings()},{headers});}
  catch{return NextResponse.json({error:'load_failed'},{status:503,headers});}
}
export async function PUT(request:NextRequest){
  const actor=await user();
  if(!canManageCampaigns(actor))return NextResponse.json({error:'Unauthorized'},{status:401,headers});
  const csrf=rejectCrossSiteAdminMutation(request,'Forbidden');if(csrf)return csrf;
  let settings;
  try{settings=sanitizePromotionSettings(await request.json());}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'invalid_settings'},{status:400,headers});}
  try{
    if(settings.enabled&&settings.campaignId){
      const {campaign,selectedCategories}=await readPromotionCampaign(settings.campaignId);
      const issue=promotionCampaignIssue(campaign,selectedCategories);
      if(issue&&issue!=='scheduled')return NextResponse.json({error:issue},{status:400,headers});
    }
    await query("INSERT INTO store_settings(key,value,updated_at) VALUES('promotion_banner',$1::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()",[JSON.stringify({...settings,updatedAt:new Date().toISOString(),updatedBy:actor?.id})]);
    return NextResponse.json({success:true,settings},{headers});
  }catch{return NextResponse.json({error:'save_failed'},{status:503,headers});}
}
