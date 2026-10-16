import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { query, withTransaction } from '@/lib/db';

export type CredentialSlot = 'primary' | 'backup';
const encryptionKey = (): Buffer => {
  const value = process.env.AI_CREDENTIAL_ENCRYPTION_KEY ?? '';
  if (!/^[a-f0-9]{64}$/i.test(value))
    throw new Error('credential_encryption_not_configured');
  return Buffer.from(value, 'hex');
};
export const encryptAiKey = (value: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(Buffer.from('apfel:gemini:v1'));
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [
    'v1',
    iv.toString('hex'),
    cipher.getAuthTag().toString('hex'),
    data.toString('hex'),
  ].join('.');
};
export const decryptAiKey = (value: string): string => {
  const [version, iv, tag, data] = value.split('.');
  if (
    version !== 'v1' ||
    !/^[a-f0-9]{24}$/.test(iv ?? '') ||
    !/^[a-f0-9]{32}$/.test(tag ?? '') ||
    !/^(?:[a-f0-9]{2})+$/.test(data ?? '')
  )
    throw new Error('credential_integrity_failed');
  const cipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(iv, 'hex'),
  );
  cipher.setAAD(Buffer.from('apfel:gemini:v1'));
  cipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([
    cipher.update(Buffer.from(data, 'hex')),
    cipher.final(),
  ]).toString('utf8');
};
export const resolveGeminiKey = async (): Promise<string> => {
  // Opt in only after additive migrations and encryption-key provisioning.
  if (process.env.AI_ADMIN_CREDENTIALS_ENABLED === 'true') {
    const result = await query(
      `SELECT c.encrypted_key FROM ai_provider_configuration s LEFT JOIN ai_provider_credentials c ON c.slot=s.active_slot WHERE s.id=true`,
    );
    if (result.rows[0]?.encrypted_key)
      return decryptAiKey(result.rows[0].encrypted_key);
    if (
      (
        await query(
          'SELECT active_slot FROM ai_provider_configuration WHERE id=true',
        )
      ).rows[0]?.active_slot
    )
      throw new Error('gemini_key_missing');
  }
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('gemini_key_missing');
  return key;
};
export const aiCredentialStatus = async () => {
  const [slots, configuration] = await Promise.all([
    query(
      'SELECT slot,label,fingerprint,validated_at,updated_at FROM ai_provider_credentials ORDER BY slot',
    ),
    query(
      'SELECT active_slot,image_model FROM ai_provider_configuration WHERE id=true',
    ),
  ]);
  return {
    slots: slots.rows,
    activeSlot: configuration.rows[0]?.active_slot ?? 'environment',
    imageModel: configuration.rows[0]?.image_model ?? 'gemini-nano-banana-2.1',
    encryptionConfigured: /^[a-f0-9]{64}$/i.test(
      process.env.AI_CREDENTIAL_ENCRYPTION_KEY ?? '',
    ),
    enabled: process.env.AI_ADMIN_CREDENTIALS_ENABLED === 'true',
  };
};
export const saveAiCredential = async (
  slot: CredentialSlot,
  key: string,
  label: string,
  actor: string,
): Promise<void> => {
  if (key.length < 20 || key.length > 256 || /\s/.test(key))
    throw new Error('invalid_key');
  const encrypted = encryptAiKey(key);
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
    {
      headers: { 'x-goog-api-key': key },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? 'research_rate_limited'
        : 'credential_validation_failed',
    );
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO ai_provider_credentials(slot,label,encrypted_key,fingerprint,validated_at,updated_by) VALUES($1,$2,$3,$4,now(),$5) ON CONFLICT(slot) DO UPDATE SET label=excluded.label,encrypted_key=excluded.encrypted_key,fingerprint=excluded.fingerprint,validated_at=now(),updated_at=now(),updated_by=excluded.updated_by`,
      [
        slot,
        label.slice(0, 80),
        encrypted,
        createHash('sha256').update(key).digest('hex').slice(0, 12),
        actor,
      ],
    );
    await client.query(
      `INSERT INTO telegram_product_events(actor,event_type,details) VALUES($1,'credential_replaced',$2)`,
      [actor, JSON.stringify({ slot })],
    );
  });
};
