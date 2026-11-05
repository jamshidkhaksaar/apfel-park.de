import { NextRequest, NextResponse } from 'next/server';
import {
  authorizeTelegramTransport,
  readBoundedBody,
  telegramError,
} from '@/lib/telegram-products/http';
import { ingestPhoto, readAssetPreview } from '@/lib/telegram-products/photos';
import {
  handleBotAction,
  validateBotRequest,
} from '@/lib/telegram-products/repository';

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const raw = await readBoundedBody(request, 12_100_000);
    authorizeTelegramTransport(request, raw);
    const payload = JSON.parse(raw),
      body = validateBotRequest(payload);
    if (!body.sessionId) throw new Error('invalid_input');
    // The status lookup independently checks membership and session ownership.
    await handleBotAction({ ...body, action: 'status' });
    if (body.action === 'preview') {
      if (!/^[a-f0-9-]{36}$/i.test(payload.assetId ?? ''))
        throw new Error('invalid_input');
      const image = await readAssetPreview(
        body.sessionId,
        payload.assetId,
        payload.edited === true,
      );
      return NextResponse.json(
        { data: image.toString('base64') },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    if (
      body.action !== 'upload' ||
      body.revision === undefined ||
      body.updateId === undefined
    )
      throw new Error('invalid_input');
    await ingestPhoto({
      ...body,
      sessionId: body.sessionId,
      revision: body.revision,
      updateId: body.updateId,
      data: payload.data,
    });
    return NextResponse.json(
      await handleBotAction({ ...body, action: 'status' }),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return telegramError(error);
  }
};
