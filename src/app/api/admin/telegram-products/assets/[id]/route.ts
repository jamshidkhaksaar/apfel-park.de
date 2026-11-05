import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ownerRequest, telegramError } from '@/lib/telegram-products/http';
import { readAssetPreview } from '@/lib/telegram-products/photos';

export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  try {
    await ownerRequest(request);
    const id = (await context.params).id;
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error('invalid_input');
    const row = (
      await query(
        'SELECT session_id FROM telegram_product_assets WHERE id=$1',
        [id],
      )
    ).rows[0];
    if (!row) throw new Error('not_found');
    const bytes = await readAssetPreview(
      row.session_id,
      id,
      request.nextUrl.searchParams.get('edited') === 'true',
    );
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return telegramError(error);
  }
};
