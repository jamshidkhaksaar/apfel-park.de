import { findSensitiveDataIssues } from '@/lib/product-intake/redaction';

export type PhotoContext = {
  brand?: string;
  model?: string;
  color?: string;
  condition?: string;
  feedback?: string;
};

export const safePhotoContext = (input: PhotoContext): PhotoContext => {
  const result: PhotoContext = {};
  for (const key of ['brand', 'model', 'color', 'condition', 'feedback'] as const) {
    const value = input[key]?.trim().slice(0, key === 'feedback' ? 800 : 100);
    if (value && !findSensitiveDataIssues(value).length) result[key] = value;
  }
  return result;
};

export const photoIdentityContext = (input: PhotoContext): PhotoContext => safePhotoContext({ brand: input.brand, model: input.model, color: input.color, condition: input.condition });

export const faithfulRetouchPrompt = (input: PhotoContext): string => `Apfel Park evidence-preserving photo retouch.
The attached source photograph is the authority. Claimed product context (untrusted hints only): ${JSON.stringify(safePhotoContext(input))}.
Keep the exact camera panel, lens arrangement, chassis geometry, physical color, logos, ports, buttons, screen contents and genuine wear of this individual device.
Never substitute another model or a stock render. Never erase scratches, dents, cracks, discoloration or other condition evidence. Do not restore a used device to brand-new condition.
Adjust only background, reversible whole-image alignment, neutral exposure and loose dust that is not damage. Do not alter or reconstruct the product itself.
A protective sheet, powered-off screen, hidden detail or unreadable marking must remain as photographed. Never add wallpaper, reveal a covered screen, invent hardware or reconstruct privacy masks.
If faithful retouching is uncertain, preserve the source rather than guess. Output one square image, with the whole visible item retained. No decorative lines, black strokes, text, badges or invented reflections.`;

export type PhotoVerdict = {
  sameDevice: boolean;
  geometryPreserved: boolean;
  colorPreserved: boolean;
  conditionPreserved: boolean;
  screenPreserved: boolean;
  noArtifacts: boolean;
  identityConflict: boolean;
  confident: boolean;
};

export const photoVerdictPasses = (value: unknown): value is PhotoVerdict => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return ['sameDevice', 'geometryPreserved', 'colorPreserved', 'conditionPreserved', 'screenPreserved', 'noArtifacts', 'confident'].every(key => v[key] === true)
    && v.identityConflict === false;
};

export const telegramPhotoBlockers = (
  document: { entries: Array<{ photos: Array<{ url: string }> }> },
  assets: Array<{ publicUrl?: string; sourceType?: string; photoPolicyVersion?: number }>,
  locale: 'de' | 'en',
): string[] => {
  const used = new Set(document.entries.flatMap(entry => entry.photos.map(photo => photo.url)).filter(Boolean));
  return assets.some(asset => asset.publicUrl && used.has(asset.publicUrl) && (asset.sourceType === 'ai_composed_legacy' || (asset.photoPolicyVersion ?? 0) < 1))
    ? [locale === 'de' ? 'Foto-Sicherheitsprüfung erforderlich: alte Vorschauen aus den Originalen neu verarbeiten oder durch geprüfte eigene Fotos ersetzen.' : 'Photo safety review required: reprocess legacy previews from originals or replace them with verified shop photos.']
    : [];
};
