import { createCipheriv,createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const encryptDeviceIdentifier = (value: string): { encrypted: string; hash: string } => {
  const normalized = value.trim().toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z0-9-]{5,40}$/.test(normalized)) throw new Error('invalid_identifier');
  const key = process.env.OPS_ASSET_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) throw new Error('identifier_storage_not_configured');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  return { encrypted: `${iv.toString('hex')}.${cipher.getAuthTag().toString('hex')}.${encrypted.toString('hex')}`,
    hash: createHash('sha256').update(key).update(normalized).digest('hex') };
};
export const decryptDeviceIdentifier=(value:string|null):string|null=>{
  if(!value) return null;
  const key=process.env.OPS_ASSET_ENCRYPTION_KEY;
  if(!key || !/^[a-f0-9]{64}$/i.test(key)) throw new Error('identifier_storage_not_configured');
  const [iv,tag,ciphertext]=value.split('.');
  if(!/^[a-f0-9]{24}$/i.test(iv ?? '') || !/^[a-f0-9]{32}$/i.test(tag ?? '') || !/^[a-f0-9]{10,80}$/i.test(ciphertext ?? '')) throw new Error('identifier_integrity_failed');
  const cipher=createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(iv,'hex'));cipher.setAuthTag(Buffer.from(tag,'hex'));
  return Buffer.concat([cipher.update(Buffer.from(ciphertext,'hex')),cipher.final()]).toString('utf8');
};
