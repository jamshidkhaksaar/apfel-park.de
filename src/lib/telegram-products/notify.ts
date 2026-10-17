import { readFile } from 'node:fs/promises';

// Published drafts are announced to the member through the Telegram transport
// bot. The token is never logged and never leaves the request URL.
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
