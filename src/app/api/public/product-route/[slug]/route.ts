import { NextResponse } from 'next/server';

import { resolvePublicProductRoute } from '@/lib/product-route-resolution';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug || slug.length > 240) {
    return NextResponse.json({ kind: 'invalid' }, { status: 400 });
  }

  try {
    return NextResponse.json(await resolvePublicProductRoute(slug));
  } catch {
    return NextResponse.json({ kind: 'unavailable' }, { status: 503 });
  }
}
