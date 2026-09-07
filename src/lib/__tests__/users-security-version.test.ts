import { scryptSync } from 'node:crypto';
import { expect, it, vi } from 'vitest';
const row = vi.hoisted(() => ({ value: {} }));
vi.mock('@/lib/db', () => ({ query: vi.fn(), createDbClient: () => {
  const chain = { from: () => chain, select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: row.value }) };
  return chain;
} }));
import { verifyUserCredentials } from '../users';
it('returns the exact security version observed with the verified password', async () => {
  row.value = { id: 'verified-uuid', email: 'owner@example.invalid', role: 'manager', security_version: 8,
    password_hash: `salt:${scryptSync('fixture-password', 'salt', 64).toString('hex')}` };
  expect(await verifyUserCredentials('owner@example.invalid', 'fixture-password'))
    .toEqual({ valid: true, userId: 'verified-uuid', role: 'manager', securityVersion: 8 });
});
