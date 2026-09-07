import { NextResponse } from 'next/server';

import { buildGoogleMerchantFeed } from '@/lib/google-merchant';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    return new NextResponse(await buildGoogleMerchantFeed(), {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
        'Content-Disposition': 'inline; filename="apfel-park-google-merchant.xml"',
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[google-merchant-feed] generation failed', error instanceof Error ? error.message : 'unknown error');
    return new NextResponse('Product feed temporarily unavailable. Please retry later.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '300', 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
};
