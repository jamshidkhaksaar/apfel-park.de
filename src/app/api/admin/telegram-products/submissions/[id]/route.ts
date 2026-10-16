import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import {
  ownerRequest,
  readBoundedBody,
  telegramError,
} from '@/lib/telegram-products/http';
import {
  event,
  readSession,
  telegramProductsEnabled,
} from '@/lib/telegram-products/repository';
import { findSensitiveDataIssues } from '@/lib/product-intake/redaction';

export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  try {
    const actor = await ownerRequest(request);
    if (!telegramProductsEnabled()) throw new Error('not_found');
    const body = JSON.parse(await readBoundedBody(request)),
      id = (await context.params).id;
    if (
      !/^[a-f0-9-]{36}$/i.test(id) ||
      !['changes', 'reject'].includes(body.action) ||
      typeof body.note !== 'string' ||
      !body.note.trim() ||
      body.note.length > 1000 ||
      findSensitiveDataIssues(body.note).length
    )
      throw new Error('invalid_input');
    await withTransaction(async (client) => {
      const row = await readSession(client, id, true);
      if (row.status !== 'submitted' || row.draft_revision !== body.revision)
        throw new Error('stale_action');
      if (
        body.action === 'changes' &&
        (
          await client.query(
            `SELECT 1 FROM telegram_product_sessions WHERE member_id=$1 AND id<>$2 AND status IN ('collecting','changes_requested')`,
            [row.member_id, id],
          )
        ).rows.length
      )
        throw new Error('another_draft_is_open');
      row.state.stage = 'review';
      await client.query(
        'UPDATE telegram_product_sessions SET status=$2,review_note=$3,state=$4,revision=revision+1,updated_at=now() WHERE id=$1',
        [
          id,
          body.action === 'changes' ? 'changes_requested' : 'rejected',
          body.note,
          JSON.stringify(row.state),
        ],
      );
      await event(
        client,
        id,
        actor,
        body.action === 'changes' ? 'changes_requested' : 'rejected',
        { note: body.note, revision: body.revision },
      );
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return telegramError(error);
  }
};
