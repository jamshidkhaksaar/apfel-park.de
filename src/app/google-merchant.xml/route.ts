import { NextResponse } from 'next/server';

import { buildGoogleMerchantFeed } from '@/lib/google-merchant';

export const dynamic = 'force-dynamic';

export const GET = async () =>
  new NextResponse(await buildGoogleMerchantFeed(), {
    headers: {
      'Cache-Control': 'public, max-age=900, s-maxage=900',
      'Content-Disposition': 'inline; filename="apfel-park-google-merchant.xml"',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
