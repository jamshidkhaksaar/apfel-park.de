import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ownerRequest, telegramError } from '@/lib/telegram-products/http';
import { telegramProductsEnabled } from '@/lib/telegram-products/repository';

// Polled by the admin toast: drafts that entered owner review after `since`.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    await ownerRequest(request);
    if (!telegramProductsEnabled()) throw new Error('not_found');
    const sinceParam = request.nextUrl.searchParams.get('since') ?? '';
    const since =
      sinceParam && !Number.isNaN(Date.parse(sinceParam)) ? sinceParam : null;
    const rows = (
      await query(
        `SELECT s.id::text AS id,s.submitted_at,m.display_name,d.document->'shared'->>'title' AS title,d.document->'shared'->>'brand' AS brand,d.document->'shared'->>'model' AS model FROM telegram_product_sessions s JOIN telegram_product_members m ON m.id=s.member_id JOIN smartphone_editor_drafts d ON d.id=s.draft_id WHERE s.status='submitted' AND d.deleted_at IS NULL AND ($1::timestamptz IS NULL OR s.submitted_at > $1::timestamptz) ORDER BY s.submitted_at DESC LIMIT 10`,
        [since],
      )
    ).rows;
    return NextResponse.json(
      {
        items: rows.map((row) => ({
          id: row.id,
          title:
            row.title ?? [row.brand, row.model].filter(Boolean).join(' '),
          displayName: row.display_name,
          submittedAt: row.submitted_at,
        })),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return telegramError(error);
  }
};
