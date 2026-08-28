import { NextResponse,type NextRequest } from "next/server";
import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { readPendingReviewImage } from "@/lib/review-media";
export async function GET(_:NextRequest,{params}:{params:Promise<{asset:string}>}){const client=await createAdminServerClient();const{data:{user}}=await client.auth.getUser();if(!canManageProducts(user))return NextResponse.json({error:"Unauthorized"},{status:401});try{const{asset}=await params;const buffer=await readPendingReviewImage(asset);return new NextResponse(buffer,{headers:{"Content-Type":"image/webp","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch{return NextResponse.json({error:"Not found"},{status:404});}}
