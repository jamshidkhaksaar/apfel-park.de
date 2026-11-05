import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  decryptAiKey,
  encryptAiKey,
  resolveGeminiKey,
} from './ai-provider-credentials';
const db = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db', () => ({ query: db.query, withTransaction: vi.fn() }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe('admin Gemini credentials', () => {
  it('uses authenticated encryption and unique nonces; rejects tampering and a wrong key', () => {
    vi.stubEnv('AI_CREDENTIAL_ENCRYPTION_KEY', 'a'.repeat(64));
    const encrypted = encryptAiKey('synthetic-provider-key');
    expect(encrypted).not.toContain('synthetic');
    expect(decryptAiKey(encrypted)).toBe('synthetic-provider-key');
    expect(encryptAiKey('synthetic-provider-key')).not.toBe(encrypted);
    const bits = encrypted.split('.');
    bits[2] = '0'.repeat(32);
    expect(() => decryptAiKey(bits.join('.'))).toThrow();
    vi.stubEnv('AI_CREDENTIAL_ENCRYPTION_KEY', 'b'.repeat(64));
    expect(() => decryptAiKey(encrypted)).toThrow();
  });
  it('keeps environment credentials without querying new tables before opt-in', async () => {
    vi.stubEnv('AI_ADMIN_CREDENTIALS_ENABLED', 'false');
    vi.stubEnv('GEMINI_API_KEY', 'environment-fixture');
    expect(await resolveGeminiKey()).toBe('environment-fixture');
    expect(db.query).not.toHaveBeenCalled();
  });
  it('switches subsequent requests and never silently falls back from corrupt encrypted keys', async () => {
    vi.stubEnv('AI_ADMIN_CREDENTIALS_ENABLED', 'true');
    vi.stubEnv('AI_CREDENTIAL_ENCRYPTION_KEY', 'a'.repeat(64));
    vi.stubEnv('GEMINI_API_KEY', 'environment-fixture');
    db.query
      .mockResolvedValueOnce({
        rows: [{ encrypted_key: encryptAiKey('primary-fixture') }],
      })
      .mockResolvedValueOnce({
        rows: [{ encrypted_key: encryptAiKey('backup-fixture') }],
      })
      .mockResolvedValueOnce({ rows: [{ encrypted_key: 'corrupt' }] });
    expect(await resolveGeminiKey()).toBe('primary-fixture');
    expect(await resolveGeminiKey()).toBe('backup-fixture');
    await expect(resolveGeminiKey()).rejects.toThrow(
      'credential_integrity_failed',
    );
  });
});
