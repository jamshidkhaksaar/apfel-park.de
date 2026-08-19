import { createHash } from 'node:crypto';

import { ProductIntakeError } from './errors';
import type { JsonValue } from './types';

const canonicalize = (value: JsonValue): string => {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new ProductIntakeError('bad_request', 'Canonical JSON cannot contain non-finite numbers');
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
    .join(',')}}`;
};

export const canonicalJson = (value: JsonValue): string => canonicalize(value);

export const sha256Hex = (value: string | Buffer): string =>
  createHash('sha256').update(value).digest('hex');

export const canonicalJsonHash = (value: JsonValue): string => sha256Hex(canonicalJson(value));

export const scopedIdempotencyKey = (scope: string, key: string): string =>
  `${scope}:${sha256Hex(key).slice(0, 48)}`;
