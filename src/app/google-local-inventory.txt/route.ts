import { NextResponse } from 'next/server';

import { buildGoogleLocalInventoryFeed } from '@/lib/google-local-inventory';

export const dynamic = 'force-dynamic';

export const GET = async () =>
  new NextResponse(await buildGoogleLocalInventoryFeed(), {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Content-Disposition': 'inline; filename="apfel-park-google-local-inventory.txt"',
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
