import { NextRequest, NextResponse } from 'next/server';
import {
  authorizeTelegramTransport,
  readBoundedBody,
  telegramError,
} from '@/lib/telegram-products/http';
import {
  handleBotAction,
  validateBotRequest,
} from '@/lib/telegram-products/repository';
import { consumePublicRateLimit } from '@/lib/public-rate-limit';

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const raw = await readBoundedBody(request);
    authorizeTelegramTransport(request, raw);
    const body = validateBotRequest(JSON.parse(raw));
    if (
      body.action === 'enroll' &&
      !(
        await consumePublicRateLimit(
          request.headers,
          `telegram-enroll:${body.telegramId}`,
          5,
          3600,
        )
      ).allowed
    )
      throw new Error('too_many_requests');
    return NextResponse.json(await handleBotAction(body), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return telegramError(error);
  }
};
