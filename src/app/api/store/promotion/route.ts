import { NextRequest, NextResponse } from 'next/server';
import { getPublicPromotion } from '@/lib/promotion-server';
import { deviceCategories } from '@/lib/promotion';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
  const category=request.nextUrl.searchParams.get('category')||undefined, slug=request.nextUrl.searchParams.get('slug')||undefined;
  const headers={'Cache-Control':'no-store'};
  if((category&&category!=='repairs'&&!(deviceCategories as readonly string[]).includes(category))||(slug&&(slug.length>200||!/^[a-zA-Z0-9_%.-]+$/.test(slug))))return NextResponse.json({promotion:null},{status:400,headers});
  try{return NextResponse.json({promotion:await getPublicPromotion({category,slug})},{headers});}
  catch{return NextResponse.json({promotion:null},{status:503,headers});}
}
