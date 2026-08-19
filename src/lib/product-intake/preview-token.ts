import { createHmac, timingSafeEqual } from 'node:crypto';

import { ProductIntakeError } from './errors';
import { canonicalJson } from './json';

const previewAudience = 'apfel-product-intake-preview';
const previewLifetimeSeconds = 24 * 60 * 60;

export type PreviewTokenClaims = {
  v: 1;
  aud: typeof previewAudience;
  runId: string;
  proposalHash: string;
  iat: number;
  exp: number;
};
const assertSecret = (secret: string): void => {
  if (secret.length < 32) throw new ProductIntakeError('forbidden', 'Preview signing is not configured', 503);
};

const signatureFor = (payload: string, secret: string): string =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export const createPreviewToken = (
  input: { runId: string; proposalHash: string },
  secret: string,
  now = new Date(),
): { token: string; expiresAt: string } => {
  assertSecret(secret);
  const issuedAt = Math.floor(now.getTime() / 1000);
  const claims: PreviewTokenClaims = {
    v: 1,
    aud: previewAudience,
    runId: input.runId,
    proposalHash: input.proposalHash,
    iat: issuedAt,
    exp: issuedAt + previewLifetimeSeconds,
  };
  const encoded = Buffer.from(canonicalJson(claims), 'utf8').toString('base64url');
  return {
    token: `${encoded}.${signatureFor(encoded, secret)}`,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  };
};

export const verifyPreviewToken = (token: string, secret: string, now = new Date()): PreviewTokenClaims => {
  assertSecret(secret);
  const [encoded, signature, extra] = token.split('.');
  if (!encoded || !signature || extra) throw new ProductIntakeError('forbidden', 'Invalid preview token', 401);

  const expected = Buffer.from(signatureFor(encoded, secret));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new ProductIntakeError('forbidden', 'Invalid preview token', 401);
  }

  let claims: PreviewTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as PreviewTokenClaims;
  } catch {
    throw new ProductIntakeError('forbidden', 'Invalid preview token', 401);
  }
  if (
    claims.v !== 1
    || claims.aud !== previewAudience
    || !/^[0-9a-f-]{36}$/i.test(claims.runId)
    || !/^[a-f0-9]{64}$/.test(claims.proposalHash)
    || !Number.isSafeInteger(claims.iat)
    || !Number.isSafeInteger(claims.exp)
    || claims.exp - claims.iat !== previewLifetimeSeconds
    || claims.iat > Math.floor(now.getTime() / 1000) + 60
  ) {
    throw new ProductIntakeError('forbidden', 'Invalid preview token', 401);
  }
  if (Math.floor(now.getTime() / 1000) >= claims.exp) {
    throw new ProductIntakeError('forbidden', 'Preview token has expired', 401);
  }
  return claims;
};
