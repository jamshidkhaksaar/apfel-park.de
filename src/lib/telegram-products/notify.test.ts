import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', async (original) => ({
  ...(await original<typeof import('node:fs/promises')>()),
  readFile: async () => {
    throw new Error('unavailable');
  },
}));

const { notifyPublished, notifyProductSold, publishedNoticeText, soldNoticeText } = await import('./notify');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('published draft notices', () => {
  it('composes the seller message from model, color and storage', () => {
    expect(
      publishedNoticeText(
        'iPhone 12',
        [{ color: 'schwarz', storage: '128 GB' }],
        'de',
      ),
    ).toBe('iPhone 12 schwarz 128 GB veröffentlicht');
    expect(
      publishedNoticeText(
        'iPhone 12',
        [{ color: 'schwarz', storage: '128 GB' }],
        'en',
      ),
    ).toBe('iPhone 12 schwarz 128 GB published');
  });
  it('caps long version lists instead of flooding the chat', () => {
    const entries = Array.from({ length: 7 }, (_, index) => ({
      color: `Farbe ${index}`,
      storage: `${index} GB`,
    }));
    const text = publishedNoticeText('iPhone 12', entries, 'de');
    expect(text.split('\n')).toHaveLength(6);
    expect(text).toContain('+2 weitere');
  });
  it('sends the message through the transport bot', async () => {
    vi.stubEnv('TELEGRAM_PRODUCT_BOT_TOKEN', `123456789:${'a'.repeat(35)}`);
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetch);
    await expect(
      notifyPublished('987654321', 'iPhone 12 schwarz 128 GB veröffentlicht'),
    ).resolves.toBe(true);
    const [url, request] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith('https://api.telegram.org/bot')).toBe(true);
    expect(url.endsWith('/sendMessage')).toBe(true);
    expect(JSON.parse(String(request.body))).toMatchObject({
      chat_id: '987654321',
      text: 'iPhone 12 schwarz 128 GB veröffentlicht',
    });
  });
  it('stays silent without a valid token or on transport failure', async () => {
    await expect(notifyPublished('987654321', 'x')).resolves.toBe(false);
    vi.stubEnv('TELEGRAM_PRODUCT_BOT_TOKEN', 'invalid');
    await expect(notifyPublished('987654321', 'x')).resolves.toBe(false);
    await expect(notifyPublished('not-a-chat', 'x')).resolves.toBe(false);
    vi.stubEnv('TELEGRAM_PRODUCT_BOT_TOKEN', `123456789:${'a'.repeat(35)}`);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('connection refused')),
    );
    await expect(notifyPublished('987654321', 'x')).resolves.toBe(false);
  });
});


describe('barcode sale Persian notifications', () => {
  it('formats short product summary with فروخته شد in Persian', () => {
    const caption = soldNoticeText({
      title: 'Apple iPhone 15 Pro',
      brand: 'Apple',
      condition: 'open_box',
      color: 'Titanium',
      storage: '256 GB',
      batteryHealth: 95,
      batteryHealthRange: { min: 95, max: 100 },
      salePrice: 849,
      originalPrice: 899,
      sku: 'AP-IP15P-256-TI',
      remainingStock: 2,
      image: null,
    });
    expect(caption).toContain('فروخته شد');
    expect(caption).toContain('Apple iPhone 15 Pro');
    expect(caption).toContain('Titanium · 256 GB');
    expect(caption).toContain('اوپن باکس');
    expect(caption).toContain('95–100%');
    expect(caption).toContain('€849');
    expect(caption).toContain('AP-IP15P-256-TI');
    expect(caption).toContain('2 عدد');
  });

  it('broadcasts to every unique active recipient', async () => {
    vi.stubEnv('TELEGRAM_PRODUCT_BOT_TOKEN', `123456789:${'a'.repeat(35)}`);
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetch);

    const outcome = await notifyProductSold(
      {
        title: 'iPhone 14',
        brand: 'Apple',
        condition: 'used',
        color: 'Black',
        storage: '128 GB',
        batteryHealth: 92,
        salePrice: 499,
        sku: 'AP-IP14-BLK',
        remainingStock: 0,
        image: null,
      },
      ['11111', '22222'],
    );
    expect(outcome).toEqual({ recipients: 2, sent: 2, failed: 0 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0]?.[0]).toContain('/sendMessage');
  });
});
