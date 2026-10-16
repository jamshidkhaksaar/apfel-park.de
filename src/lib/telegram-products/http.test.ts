import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { authorizeTelegramTransport, readBoundedBody } from './http';
import { validateBotRequest } from './repository';
import { signHmacRequest } from '@/lib/product-intake/hmac';
afterEach(() => vi.unstubAllEnvs());
describe('scoped Telegram integration boundary', () => {
  it('accepts the dedicated signature and rejects another integration key or changed body', () => {
    vi.stubEnv('TELEGRAM_PRODUCTS_ENABLED', 'true');
    vi.stubEnv('TELEGRAM_PRODUCT_HMAC_SECRET', 'x'.repeat(40));
    const body = '{"action":"status"}',
      path = '/api/integrations/telegram-products',
      timestamp = String(Math.floor(Date.now() / 1000));
    const parts = {
      method: 'POST',
      path,
      body,
      timestamp,
      keyId: 'telegram-products',
      idempotencyKey: 'test-signature',
    };
    const headers = {
      'x-apfel-intake-key-id': parts.keyId,
      'x-apfel-intake-timestamp': timestamp,
      'x-apfel-intake-signature': signHmacRequest(parts, 'x'.repeat(40)),
      'idempotency-key': parts.idempotencyKey,
    };
    expect(() =>
      authorizeTelegramTransport(
        new NextRequest(`http://localhost${path}`, { method: 'POST', headers }),
        body,
      ),
    ).not.toThrow();
    expect(() =>
      authorizeTelegramTransport(
        new NextRequest(`http://localhost${path}`, { method: 'POST', headers }),
        body + ' ',
      ),
    ).toThrow();
    expect(() =>
      authorizeTelegramTransport(
        new NextRequest(`http://localhost${path}`, {
          method: 'POST',
          headers: { ...headers, 'x-apfel-intake-key-id': 'owner' },
        }),
        body,
      ),
    ).toThrow('unauthorized');
  });
  it('bounds streamed JSON even without Content-Length', async () => {
    await expect(
      readBoundedBody(
        new NextRequest('http://localhost', {
          method: 'POST',
          body: 'x'.repeat(40),
        }),
        10,
      ),
    ).rejects.toThrow('request_too_large');
  });
  it('requires numeric Telegram identity and a matching private chat', () => {
    expect(() =>
      validateBotRequest({ telegramId: '12', chatId: '-10012', action: 'new' }),
    ).toThrow('invalid_input');
    expect(() =>
      validateBotRequest({
        telegramId: 'username',
        chatId: 'username',
        action: 'new',
      }),
    ).toThrow('invalid_input');
    expect(
      validateBotRequest({
        telegramId: '123456789',
        chatId: '123456789',
        action: 'status',
      }).action,
    ).toBe('status');
  });
});
