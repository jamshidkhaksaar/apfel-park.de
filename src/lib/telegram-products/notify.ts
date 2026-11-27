import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { query } from '@/lib/db';
import { resolveUploadPath } from '@/lib/blob';
import { formatBatteryHealth, type BatteryHealthRange } from '@/lib/product-offer-options';

type SqlExecutor = { query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }> };

// Published drafts and barcode sales are announced to members through the
// Telegram transport bot. The token is never logged and never leaves the request URL.
const resolveBotToken = async (): Promise<string | null> => {
  let token = process.env.TELEGRAM_PRODUCT_BOT_TOKEN?.trim();
  if (!token) {
    try {
      const config = await readFile(
        '/srv/bot-factory/bots/apfel-park-intake-v2/.env',
        'utf8',
      );
      token = config
        .match(/^BOT_TOKEN=(.*)$/m)?.[1]
        ?.trim()
        .replace(/^(['"])(.*)\1$/, '$2');
    } catch {
      return null;
    }
  }
  return token && /^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(token) ? token : null;
};

export const publishedNoticeText = (
  model: string | undefined,
  entries: Array<{ color?: string; storage?: string }>,
  locale: 'de' | 'en',
): string => {
  const word = locale === 'de' ? 'veröffentlicht' : 'published';
  const lines = entries
    .slice(0, 5)
    .map((entry) =>
      [model, entry.color, entry.storage]
        .filter(Boolean)
        .join(' ')
        .trim(),
    )
    .filter(Boolean)
    .map((line) => `${line} ${word}`);
  if (entries.length > 5)
    lines.push(
      locale === 'de'
        ? `+${entries.length - 5} weitere`
        : `+${entries.length - 5} more`,
    );
  return lines.join('\n');
};

export const notifyPublished = async (
  telegramId: string,
  text: string,
): Promise<boolean> => {
  if (!/^[1-9]\d{0,15}$/.test(telegramId) || !text.trim()) return false;
  const token = await resolveBotToken();
  if (!token) return false;
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({ chat_id: telegramId, text: text.slice(0, 1000) }),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
};

export type SoldNoticeInput = {
  title: string;
  brand?: string | null;
  condition?: string | null;
  color?: string | null;
  storage?: string | null;
  batteryHealth?: number | null;
  batteryHealthRange?: BatteryHealthRange | null;
  salePrice: number;
  originalPrice?: number | null;
  sku: string;
  remainingStock: number;
  image?: string | null;
};

const persianCondition = (condition: string | null | undefined): string => {
  if (condition === 'open_box') return 'اوپن باکس (Open Box)';
  if (condition === 'used') return 'کارکرده A+';
  return 'نو / پلمپ';
};

const formatEuro = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `€${rounded}` : `€${rounded.toFixed(2)}`;
};

/** Short Persian broadcast caption for a 1-unit barcode sale. */
export const soldNoticeText = (input: SoldNoticeInput): string => {
  const specs = [input.color?.trim(), input.storage?.trim()]
    .filter(Boolean)
    .join(' · ');
  const battery = formatBatteryHealth(
    input.batteryHealth,
    input.batteryHealthRange ?? undefined,
  );
  const priceLine =
    typeof input.originalPrice === 'number' &&
    input.originalPrice > input.salePrice
      ? `${formatEuro(input.salePrice)} (قیمت لیست ${formatEuro(input.originalPrice)})`
      : formatEuro(input.salePrice);

  const lines = [
    '✅ فروخته شد',
    '',
    `📱 ${(() => { const b = input.brand?.trim() ?? ''; const t = input.title.trim(); return b && !t.toLowerCase().startsWith(b.toLowerCase()) ? `${b} ${t}` : t; })()}`,
    specs ? `🎨 مشخصات: ${specs}` : null,
    `📦 وضعیت: ${persianCondition(input.condition)}`,
    battery ? `🔋 سلامت باتری: ${battery}` : null,
    `💶 قیمت: ${priceLine}`,
    `🏷 کد (SKU): ${input.sku}`,
    `📊 موجودی باقی‌مانده: ${Math.max(0, Math.trunc(input.remainingStock))} عدد`,
  ].filter((line): line is string => line !== null);

  return lines.join('\n').slice(0, 950);
};

export const listActiveTelegramRecipientIds = async (
  executor: SqlExecutor = { query },
): Promise<string[]> => {
  const rows = (
    await executor.query(
      `SELECT telegram_id::text AS telegram_id
         FROM telegram_product_members
        WHERE status = 'active'
        ORDER BY created_at`,
    )
  ).rows as Array<{ telegram_id: string }>;

  const extra = (process.env.TELEGRAM_SALE_NOTIFY_CHAT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return [
    ...new Set(
      [...rows.map((r) => r.telegram_id), ...extra].filter((id) =>
        /^-?[1-9]\d{0,15}$/.test(id),
      ),
    ),
  ];
};

const loadTelegramJpeg = async (imagePath: string | null | undefined): Promise<Buffer | null> => {
  if (!imagePath) return null;
  try {
    let raw: Buffer | null = null;
    if (imagePath.startsWith('/uploads/')) {
      const local = resolveUploadPath(imagePath);
      if (local) raw = await readFile(local);
    } else if (/^https:\/\//i.test(imagePath)) {
      const res = await fetch(imagePath, {
        redirect: 'follow',
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) raw = Buffer.from(await res.arrayBuffer());
    }
    if (!raw || !raw.length) return null;
    // Telegram sendPhoto reliably displays JPEG/PNG; local catalog assets are WebP.
    return await sharp(raw, { limitInputPixels: 25_000_000 })
      .rotate()
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    return null;
  }
};

const sendSoldMessageToRecipient = async (
  token: string,
  chatId: string,
  caption: string,
  photoJpeg: Buffer | null,
  fallbackPhotoUrl: string | null,
): Promise<boolean> => {
  if (!/^-?[1-9]\d{0,15}$/.test(chatId)) return false;
  try {
    if (photoJpeg) {
      const form = new FormData();
      form.set('chat_id', chatId);
      form.set('caption', caption);
      form.set(
        'photo',
        new File([new Uint8Array(photoJpeg)], 'product.jpg', { type: 'image/jpeg' }),
      );
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendPhoto`,
        {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(15_000),
          body: form,
        },
      );
      if (response.ok) return true;
    } else if (fallbackPhotoUrl && /^https:\/\//i.test(fallbackPhotoUrl)) {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendPhoto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          redirect: 'error',
          signal: AbortSignal.timeout(12_000),
          body: JSON.stringify({
            chat_id: chatId,
            photo: fallbackPhotoUrl,
            caption,
          }),
        },
      );
      if (response.ok) return true;
    }

    const fallback = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({ chat_id: chatId, text: caption }),
      },
    );
    return fallback.ok;
  } catch {
    return false;
  }
};

export type SoldBroadcastResult = {
  recipients: number;
  sent: number;
  failed: number;
};

/** Broadcast a Persian "فروخته شد" alert with product image to all recipients. */
export const notifyProductSold = async (
  input: SoldNoticeInput,
  recipientIds?: string[],
): Promise<SoldBroadcastResult> => {
  const recipients =
    recipientIds ?? (await listActiveTelegramRecipientIds());
  if (!recipients.length) return { recipients: 0, sent: 0, failed: 0 };
  const token = await resolveBotToken();
  if (!token) return { recipients: recipients.length, sent: 0, failed: recipients.length };

  const caption = soldNoticeText(input);
  const photoJpeg = await loadTelegramJpeg(input.image);
  const fallbackUrl =
    input.image && /^https:\/\//i.test(input.image) ? input.image : null;

  const outcomes = await Promise.all(
    recipients.map((chatId) =>
      sendSoldMessageToRecipient(token, chatId, caption, photoJpeg, fallbackUrl),
    ),
  );
  const sent = outcomes.filter(Boolean).length;
  return {
    recipients: recipients.length,
    sent,
    failed: recipients.length - sent,
  };
};
