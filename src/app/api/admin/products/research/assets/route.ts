import { NextRequest, NextResponse } from 'next/server';
import { canManageProducts } from '@/lib/admin-auth';
import { readSessionUserFromRequest } from '@/lib/session';
import { licensedResearchImages } from '@/lib/product-research-assets';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!canManageProducts(await readSessionUserFromRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const brand = params.get('brand') ?? '';
  const model = params.get('model') ?? '';
  const color = params.get('color') ?? '';
  if (!brand || !model || !color || brand.length > 100 || model.length > 160 || color.length > 80) return NextResponse.json({ images: [] });
  return NextResponse.json({ images: await licensedResearchImages({ brand, model, color, condition: params.get('condition') ?? undefined }) });
}
