import { NextResponse } from 'next/server';

import { buildGoogleLocalInventoryFeed } from '@/lib/google-local-inventory';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    return new NextResponse(await buildGoogleLocalInventoryFeed(), {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
        'Content-Disposition': 'inline; filename="apfel-park-google-local-inventory.txt"',
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    console.error('[google-local-inventory-feed] generation failed', error instanceof Error ? error.message : 'unknown error');
    return new NextResponse('Local inventory feed temporarily unavailable. Please retry later.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '300', 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }
};
