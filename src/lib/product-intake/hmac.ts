import { createHmac, timingSafeEqual } from 'node:crypto';

import { ProductIntakeError } from './errors';
import { sha256Hex } from './json';

export const intakeHmacHeaders = {
  keyId: 'x-apfel-intake-key-id',
  timestamp: 'x-apfel-intake-timestamp',
  signature: 'x-apfel-intake-signature',
  idempotencyKey: 'idempotency-key',
} as const;

export type HmacRequestParts = {
  method: string;
  path: string;
  timestamp: string;
  keyId: string;
  idempotencyKey?: string | null;
  body: string;
};

export type HmacVerificationOptions = {
  secrets: Readonly<Record<string, string>>;
  now?: Date;
  toleranceSeconds?: number;
};

export const canonicalHmacRequest = (parts: HmacRequestParts): string => [
  'APFEL-PRODUCT-INTAKE-V1',
  parts.keyId,
  parts.timestamp,
  parts.method.toUpperCase(),
  parts.path,
  parts.idempotencyKey ?? '',
  sha256Hex(parts.body),
].join('\n');

export const signHmacRequest = (parts: HmacRequestParts, secret: string): string =>
  createHmac('sha256', secret).update(canonicalHmacRequest(parts)).digest('hex');

const parseSignature = (value: string): string | null => {
  const normalized = value.startsWith('sha256=') ? value.slice(7) : value;
  return /^[a-f0-9]{64}$/i.test(normalized) ? normalized.toLowerCase() : null;
};

export const verifyHmacRequest = (
  parts: HmacRequestParts & { signature: string },
  options: HmacVerificationOptions,
): { keyId: string; timestamp: number } => {
  if (!/^\d{10}$/.test(parts.timestamp)) {
    throw new ProductIntakeError('invalid_signature', 'Invalid integration signature', 401);
  }
  const timestamp = Number(parts.timestamp);
  const now = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const tolerance = options.toleranceSeconds ?? 300;
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > tolerance) {
    throw new ProductIntakeError('stale_request', 'Integration request timestamp is outside the allowed window', 401);
  }

  const secret = options.secrets[parts.keyId];
  const provided = parseSignature(parts.signature);
  if (!secret || secret.length < 32 || !provided) {
    throw new ProductIntakeError('invalid_signature', 'Invalid integration signature', 401);
  }
  const expected = signHmacRequest(parts, secret);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(provided, 'hex');
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new ProductIntakeError('invalid_signature', 'Invalid integration signature', 401);
  }
  return { keyId: parts.keyId, timestamp };
};

export const loadHmacSecrets = (environment: NodeJS.ProcessEnv = process.env): Record<string, string> => {
  const encoded = environment.PRODUCT_INTAKE_HMAC_KEYS_B64?.trim()
    ? Buffer.from(environment.PRODUCT_INTAKE_HMAC_KEYS_B64.trim(), 'base64').toString('utf8')
    : environment.PRODUCT_INTAKE_HMAC_KEYS?.trim();
  if (encoded) {
    try {
      const parsed = JSON.parse(encoded) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const keys = Object.fromEntries(
          Object.entries(parsed)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length >= 32),
        );
        if (Object.keys(keys).length > 0) return keys;
      }
    } catch {
      // Fall through to the single-key configuration.
    }
  }
  const secret = environment.PRODUCT_INTAKE_HMAC_SECRET?.trim();
  if (!secret || secret.length < 32) return {};
  return { [environment.PRODUCT_INTAKE_HMAC_KEY_ID?.trim() || 'default']: secret };
};
