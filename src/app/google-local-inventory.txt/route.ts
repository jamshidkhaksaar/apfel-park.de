import { NextResponse } from 'next/server';

import { buildGoogleLocalInventoryFeed } from '@/lib/google-local-inventory';

export const dynamic = 'force-dynamic';

export const GET = async () =>
  new NextResponse(await buildGoogleLocalInventoryFeed(), {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
      'Content-Disposition': 'inline; filename="apfel-park-google-local-inventory.txt"',
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
