import { NextRequest, NextResponse } from 'next/server';
import { consumePublicRateLimit } from '@/lib/public-rate-limit';
import { resolveRepairQuote } from '@/lib/repair-booking-server';
import { repairBookingError, repairBookingErrorStatus } from '@/lib/repair-booking';
export async function POST(request:NextRequest){
  const headers={'Cache-Control':'no-store'};
  const limit=await consumePublicRateLimit(request.headers,'repair_quote',30,60);
  if(!limit.allowed)return NextResponse.json({success:false,error:'Please try again later.'},{status:429,headers});
  let de=true;
  try{
    const text=await request.text();if(text.length>8192)return NextResponse.json({success:false,error:'Request too large'},{status:413,headers});
    const input=JSON.parse(text);de=input.locale!=='en';
    return NextResponse.json({success:true,quote:await resolveRepairQuote(input)},{headers});
  }catch(error){const code=error instanceof Error?error.message:'';return NextResponse.json({success:false,error:repairBookingError(code,de)},{status:repairBookingErrorStatus(code),headers});}
}
