import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import {
  aiCredentialStatus,
  saveAiCredential,
} from '@/lib/ai-provider-credentials';
import {
  createInvite,
  event,
  telegramProductsEnabled,
} from '@/lib/telegram-products/repository';
import {
  ownerRequest,
  readBoundedBody,
  telegramError,
} from '@/lib/telegram-products/http';

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    await ownerRequest(request);
    if (!telegramProductsEnabled()) throw new Error('not_found');
    const [members, credentials] = await Promise.all([
      query(
        'SELECT id,telegram_id::text,display_name,locale,status,approved_at,last_seen_at FROM telegram_product_members ORDER BY created_at DESC',
      ),
      aiCredentialStatus(),
    ]);
    return NextResponse.json(
      {
        members: members.rows,
        credentials,
        botUsername: process.env.TELEGRAM_PRODUCT_BOT_USERNAME ?? '',
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return telegramError(error);
  }
};
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body = JSON.parse(await readBoundedBody(request));
    const actor = await ownerRequest(
      request,
      typeof body.password === 'string' ? body.password : '',
    );
    if (!telegramProductsEnabled()) throw new Error('not_found');
    if (body.action === 'invite') {
      const token = await createInvite(
        String(body.label ?? '').slice(0, 80),
        actor,
      );
      return NextResponse.json(
        { token },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    if (['approve', 'revoke'].includes(body.action)) {
      if (!/^[a-f0-9-]{36}$/i.test(body.memberId ?? ''))
        throw new Error('invalid_input');
      await withTransaction(async (client) => {
        const result = await client.query(
          `UPDATE telegram_product_members SET status=$2,approved_by=$3,approved_at=CASE WHEN $2='active' THEN now() ELSE approved_at END WHERE id=$1 RETURNING id`,
          [
            body.memberId,
            body.action === 'approve' ? 'active' : 'revoked',
            actor,
          ],
        );
        if (!result.rowCount) throw new Error('member_not_found');
        if (body.action === 'revoke')
          await client.query(
            `UPDATE telegram_product_jobs SET status='cancelled',lease=null,lease_until=null WHERE session_id IN (SELECT id FROM telegram_product_sessions WHERE member_id=$1) AND status IN ('queued','processing')`,
            [body.memberId],
          );
        await event(client, null, actor, `member_${body.action}`, {
          memberId: body.memberId,
        });
      });
    } else if (body.action === 'save_key') {
      if (
        !['primary', 'backup'].includes(body.slot) ||
        typeof body.key !== 'string' ||
        typeof body.label !== 'string'
      )
        throw new Error('invalid_input');
      await saveAiCredential(body.slot, body.key, body.label, actor);
    } else if (body.action === 'activate_key' || body.action === 'remove_key') {
      if (!['primary', 'backup', 'environment'].includes(body.slot))
        throw new Error('invalid_input');
      await withTransaction(async (client) => {
        const config = (
          await client.query(
            'SELECT active_slot FROM ai_provider_configuration WHERE id=true FOR UPDATE',
          )
        ).rows[0];
        if (body.action === 'remove_key') {
          if (config.active_slot === body.slot)
            throw new Error('active_key_cannot_be_removed');
          await client.query(
            'DELETE FROM ai_provider_credentials WHERE slot=$1',
            [body.slot],
          );
        } else {
          if (
            body.slot !== 'environment' &&
            !(
              await client.query(
                'SELECT 1 FROM ai_provider_credentials WHERE slot=$1 AND validated_at IS NOT NULL',
                [body.slot],
              )
            ).rows.length
          )
            throw new Error('validate_key_first');
          await client.query(
            'UPDATE ai_provider_configuration SET active_slot=$1,updated_at=now() WHERE id=true',
            [body.slot === 'environment' ? null : body.slot],
          );
        }
        await event(client, null, actor, body.action, { slot: body.slot });
      });
    } else if (body.action === 'image_model') {
      if (
        ![
          'gemini-nano-banana-2.1',
          'gemini-3.1-flash-image',
          'gemini-3-pro-image',
        ].includes(body.model)
      )
        throw new Error('invalid_image_model');
      await query(
        'UPDATE ai_provider_configuration SET image_model=$1,updated_at=now() WHERE id=true',
        [body.model],
      );
    } else throw new Error('invalid_action');
    return NextResponse.json(
      { success: true },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return telegramError(error);
  }
};
