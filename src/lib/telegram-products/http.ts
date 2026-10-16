import { NextRequest, NextResponse } from 'next/server';
import { verifyHmacRequest } from '@/lib/product-intake/hmac';
import { readSessionUserFromRequest } from '@/lib/session';
import { isProductIntakeOwner } from '@/lib/product-intake/owner';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { consumePublicRateLimit } from '@/lib/public-rate-limit';
import { verifyUserCredentials } from '@/lib/users';
import { telegramProductsEnabled } from './repository';

export const readBoundedBody = async (
  request: NextRequest,
  maximum = 16000,
): Promise<string> => {
  if (Number(request.headers.get('content-length')) > maximum)
    throw new Error('request_too_large');
  if (!request.body) throw new Error('invalid_input');
  const reader = request.body.getReader(),
    parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new Error('request_too_large');
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts).toString('utf8');
};
export const authorizeTelegramTransport = (
  request: NextRequest,
  raw: string,
): void => {
  if (!telegramProductsEnabled()) throw new Error('not_found');
  const keyId = process.env.TELEGRAM_PRODUCT_KEY_ID || 'telegram-products';
  if (request.headers.get('x-apfel-intake-key-id') !== keyId)
    throw new Error('unauthorized');
  verifyHmacRequest(
    {
      method: request.method,
      path: request.nextUrl.pathname,
      body: raw,
      keyId,
      timestamp: request.headers.get('x-apfel-intake-timestamp') ?? '',
      idempotencyKey: request.headers.get('idempotency-key'),
      signature: request.headers.get('x-apfel-intake-signature') ?? '',
    },
    { secrets: { [keyId]: process.env.TELEGRAM_PRODUCT_HMAC_SECRET ?? '' } },
  );
};
export const ownerRequest = async (
  request: NextRequest,
  password?: string,
): Promise<string> => {
  const user = await readSessionUserFromRequest(request);
  if (!user || !isProductIntakeOwner(user)) throw new Error('forbidden');
  if (request.method !== 'GET') {
    if (rejectCrossSiteAdminMutation(request)) throw new Error('forbidden');
    if (
      !(
        await consumePublicRateLimit(
          request.headers,
          `telegram-settings:${user.id}`,
          12,
          300,
        )
      ).allowed
    )
      throw new Error('too_many_requests');
    if (password !== undefined) {
      if (
        typeof password !== 'string' ||
        password.length > 256 ||
        !(await verifyUserCredentials(user.email!, password)).valid
      )
        throw new Error('reauthentication_failed');
    }
  }
  return user.id;
};
export const telegramError = (error: unknown): NextResponse => {
  const message = error instanceof Error ? error.message : 'request_failed';
  const code = /^[a-z_]{3,80}$/.test(message) ? message : 'request_failed';
  const status = [
    'forbidden',
    'membership_required',
    'submission_locked',
  ].includes(code)
    ? 403
    : code === 'unauthorized'
      ? 401
      : code === 'not_found'
        ? 404
        : code === 'stale_action' || code === 'update_conflict'
          ? 409
          : code === 'too_many_requests'
            ? 429
            : 400;
  return NextResponse.json(
    { error: code },
    { status, headers: { 'Cache-Control': 'private, no-store' } },
  );
};
