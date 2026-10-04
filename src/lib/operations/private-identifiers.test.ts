import { afterEach,it,expect,vi } from 'vitest';
import { decryptDeviceIdentifier,encryptDeviceIdentifier } from './private-identifiers';
afterEach(()=>vi.unstubAllEnvs());
it('encrypts private device identifiers and authenticates the stored ciphertext',()=>{
  vi.stubEnv('OPS_ASSET_ENCRYPTION_KEY','0'.repeat(64));
  const value=encryptDeviceIdentifier('SYNTEST-123456');
  expect(value.encrypted).not.toContain('SYNTEST');expect(decryptDeviceIdentifier(value.encrypted)).toBe('SYNTEST-123456');
  const corrupted=value.encrypted.slice(0,-2)+(value.encrypted.endsWith('00') ? '11':'00');
  expect(()=>decryptDeviceIdentifier(corrupted)).toThrow();
});
it('never falls back to plaintext when the protected key is absent',()=>{
  vi.stubEnv('OPS_ASSET_ENCRYPTION_KEY','');expect(()=>encryptDeviceIdentifier('SYNTEST-123456')).toThrow('identifier_storage_not_configured');
});
