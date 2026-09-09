import { createHash, randomUUID } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { findSensitiveDataIssues } from '@/lib/product-intake/redaction';

export type ResearchPhoto = { mime: 'image/webp'; data: string; hints: Record<string, unknown> };

const visionToken = async (): Promise<string> => {
  if (process.env.APFEL_INTAKE_VISION_TOKEN?.trim()) return process.env.APFEL_INTAKE_VISION_TOKEN.trim();
  const config = await readFile('/etc/apfel-intake-vision.env', 'utf8');
  const value = config.match(/^APFEL_INTAKE_VISION_TOKEN=(.*)$/m)?.[1]?.trim() ?? '';
  return value.replace(/^(['"])(.*)\1$/, '$2');
};

/** Raw pixels stay on localhost. Only the checked derivative can reach Gemini. */
export const prepareResearchPhoto = async (file: File, kind: string): Promise<ResearchPhoto> => {
  if (!['barcode_label','about_screen','battery_health'].includes(kind) || !file.size || file.size > 8 * 1024 * 1024) throw new Error('photo_invalid');
  const bytes = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(bytes, { limitInputPixels: 25_000_000 }).metadata().catch(() => { throw new Error('photo_invalid'); });
  if (!meta.format || !['jpeg','png','webp'].includes(meta.format)) throw new Error('photo_invalid');
  let token: string;
  try { token = await visionToken(); } catch { throw new Error('photo_privacy_unavailable'); }
  if (token.length < 32) throw new Error('photo_privacy_unavailable');
  const runId = `research-${randomUUID()}`;
  const form = new FormData();
  form.set('run_id', runId);
  form.set('asset_type', kind);
  form.set('image', new File([new Uint8Array(bytes)], `device.${meta.format === 'jpeg' ? 'jpg' : meta.format}`, { type: `image/${meta.format}` }));
  const response = await fetch('http://127.0.0.1:8730/extract', { method: 'POST', headers: { 'X-Vision-Token': token }, body: form, redirect: 'error', signal: AbortSignal.timeout(18000) });
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(error.detail?.includes('NonDeviceDocument') ? 'photo_wrong_document' : 'photo_privacy_failed');
  }
  const result = await response.json() as Record<string, unknown>;
  if (result.privacyScanPassed !== true || typeof result.redactedPath !== 'string' || typeof result.redactedSha256 !== 'string') throw new Error('photo_privacy_failed');
  const candidates = Array.isArray(result.gtinCandidates) ? result.gtinCandidates : [];
  const hasRetailBarcode = candidates.some(candidate => candidate && typeof candidate === 'object' && candidate.autoAccept === true && candidate.checksumValid === true && candidate.extractionMethod === 'barcode');
  const hasPartNumber = typeof result.manufacturerPartNumber === 'string' && result.manufacturerPartNumber.length >= 5 && /\d/.test(result.manufacturerPartNumber);
  if (!result.hardwareModel && !result.modelName && !hasRetailBarcode && !hasPartNumber) throw new Error('photo_device_evidence_missing');
  const expected = `/srv/n8n/media/intake/${runId}/`;
  const resolved = await realpath(result.redactedPath);
  if (!resolved.startsWith(expected) || path.extname(resolved) !== '.webp') throw new Error('photo_privacy_failed');
  const redacted = await readFile(resolved);
  if (redacted.length > 8 * 1024 * 1024 || createHash('sha256').update(redacted).digest('hex') !== result.redactedSha256) throw new Error('photo_privacy_failed');
  if ((await sharp(redacted, { limitInputPixels: 25_000_000 }).metadata()).format !== 'webp') throw new Error('photo_privacy_failed');
  const fields = ['brand','modelName','hardwareModel','manufacturerPartNumber','storage','color','gtinCandidates','conflicts','requiresConfirmation'];
  const hints = Object.fromEntries(fields.filter(field => result[field] !== undefined).map(field => [field, result[field]]));
  hints.gtinCandidates = candidates.filter(candidate => candidate && typeof candidate === 'object' && candidate.autoAccept === true && candidate.checksumValid === true && candidate.extractionMethod === 'barcode');
  if (findSensitiveDataIssues(hints).length || (Array.isArray(result.conflicts) && result.conflicts.length)) throw new Error('photo_identity_conflict');
  return { mime: 'image/webp', data: redacted.toString('base64'), hints };
};
