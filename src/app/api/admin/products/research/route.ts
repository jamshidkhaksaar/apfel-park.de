import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { canManageProducts } from '@/lib/admin-auth';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { readSessionUserFromRequest } from '@/lib/session';
import { findSensitiveDataIssues } from '@/lib/product-intake/redaction';
import { prepareResearchPhoto } from '@/lib/product-research-photo';
import { researchProductFromOfficialPages } from '@/lib/product-research-service';
import { researchExactEprel } from '@/lib/product-research-eprel';
import { licensedResearchImages } from '@/lib/product-research-assets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const messages: Record<string, [string, string]> = {
  gemini_key_missing: ['Gemini API-Schlüssel ist nicht eingerichtet.', 'Gemini API key is not configured.'],
  official_sources_unavailable: ['Keine passende offizielle Quelle konnte aktuell gelesen werden. Modell genauer angeben oder Angaben manuell ergänzen.', 'No matching official source could be read. Refine the model or complete the fields manually.'],
  research_unverified_model: ['Das genaue Modell konnte nicht aus offiziellen Quellen bestätigt werden.', 'The exact model could not be confirmed from official sources.'],
  research_not_german: ['Die Antwort war nicht auf Deutsch und wurde nicht übernommen. Bitte erneut versuchen.', 'The response was not in German and was not applied. Please retry.'],
  research_rate_limited: ['Die Recherche ist vorübergehend ausgelastet. Bitte später erneut versuchen.', 'Research is temporarily rate-limited. Please retry later.'],
  research_timeout: ['Die Recherche hat zu lange gedauert. Deine Eingaben bleiben unverändert.', 'Research timed out. Your entries remain unchanged.'],
  photo_invalid: ['Bitte ein klares JPEG-, PNG- oder WebP-Foto bis 8 MB verwenden.', 'Use a clear JPEG, PNG or WebP photo up to 8 MB.'],
  photo_privacy_unavailable: ['Die lokale Datenschutzprüfung ist nicht erreichbar. Das Foto wurde nicht an Gemini gesendet.', 'Local privacy checking is unavailable. The photo was not sent to Gemini.'],
  photo_privacy_failed: ['Das Foto konnte nicht sicher vorbereitet werden. Bitte sensible Felder abdecken und ein klareres Foto senden.', 'The photo could not be prepared safely. Cover sensitive fields and send a clearer photo.'],
  photo_identity_conflict: ['Die Fotoangaben sind widersprüchlich. Bitte Modell und Foto prüfen.', 'Photo evidence conflicts. Check the model and photo.'],
  photo_wrong_document: ['Bitte hier keine Ausweise, Rechnungen oder Versanddokumente hochladen. Nutze nur das Produktetikett oder die Geräteinformationen.', 'Do not upload identity, invoice or shipping documents here. Use only the product label or device information.'],
  photo_device_evidence_missing: ['Keine eindeutige Geräteangabe erkannt. Bitte ein klares Barcode-Etikett oder die Modellinformationen des Geräts fotografieren.', 'No clear device identity was detected. Use a clear barcode label or device model-information screenshot.'],
  research_private_data: ['Die Antwort enthielt nicht zulässige Gerätekennungen und wurde verworfen.', 'The response contained prohibited device identifiers and was discarded.'],
  research_invalid_json: ['Die Recherche lieferte keine verwendbare Antwort. Deine Eingaben bleiben unverändert.', 'Research returned an unusable response. Your entries remain unchanged.'],
  research_incomplete: ['Die Recherche war unvollständig und wurde nicht übernommen.', 'Research was incomplete and was not applied.'],
  research_provider_failed: ['Der Recherchedienst ist vorübergehend nicht verfügbar. Bitte erneut versuchen.', 'The research provider is temporarily unavailable. Please retry.'],
  research_failed: ['Die Recherche konnte nicht abgeschlossen werden. Deine Eingaben bleiben unverändert.', 'Research could not be completed. Your entries remain unchanged.'],
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;
  if (process.env.LEGACY_PRODUCT_RESEARCH_ENABLED !== 'true') return NextResponse.json({ error: 'Product research is disabled', code: 'legacy_research_disabled' }, { status: 410 });
  try {
    const form = (request.headers.get('content-type') ?? '').includes('multipart/form-data') ? await request.formData() : null;
    const body = form ? Object.fromEntries(form.entries()) : await request.json() as Record<string, unknown>;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const condition = typeof body.condition === 'string' ? body.condition : undefined;
    const hardwareModel = typeof body.hardwareModel === 'string' ? body.hardwareModel.trim() : '';
    const eprelId = typeof body.eprelId === 'string' ? body.eprelId.trim() : '';
    const color = typeof body.color === 'string' ? body.color.trim() : '';
    const file = form?.get('photo');
    if (query.length > 200 || hardwareModel.length > 100 || eprelId.length > 16 || color.length > 80
        || (condition && !['new','open_box','used'].includes(condition)) || (!query && !(file instanceof File))) {
      return NextResponse.json({ error: 'Provide a model name or photo; check input lengths and condition.', code: 'invalid_input' }, { status: 400 });
    }
    if (findSensitiveDataIssues({ query, hardwareModel, eprelId, color }).length) return NextResponse.json({ error: 'Query contains sensitive identifiers', code: 'private_input' }, { status: 400 });
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(75000)]);
    const photo = file instanceof File ? await prepareResearchPhoto(file, typeof body.assetType === 'string' ? body.assetType : 'barcode_label') : undefined;
    const research = await researchProductFromOfficialPages({ query, condition, photo, hardwareModel }, signal);
    research.skuSuggestion = `AP-${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
    try {
      const eprel = await researchExactEprel({ brand: research.brand!, model: research.model!, hardwareModel, eprelId }, signal);
      if (eprel) {
        const { source, ...fields } = eprel;
        Object.assign(research, fields);
        research.researchSources?.push(source);
      }
      else research.researchWarnings?.push('EPREL nicht automatisch bestätigt: exakte Hardware-Modellnummer mit dem Register abgleichen. Es wurde keine Energieklasse geraten.');
    } catch { research.researchWarnings?.push('EPREL ist gerade nicht erreichbar. Energieangaben bitte später anhand des Registers ergänzen.'); }
    research.gallery = await licensedResearchImages({ brand: research.brand!, model: research.model!, query, color, condition });
    if (!research.gallery.length) research.researchWarnings?.push('Keine freigegebenen Herstellerbilder für dieses Modell und diese Farbe hinterlegt. Bitte eigene Produktfotos hochladen.');
    return NextResponse.json({ success: true, research });
  } catch (error) {
    const key = error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name) ? 'research_timeout' : error instanceof Error && messages[error.message] ? error.message : 'research_failed';
    const [errorDe, errorEn] = messages[key];
    console.warn('[product research]', { code: key });
    return NextResponse.json({ error: errorDe, errorEn, code: key }, { status: key.startsWith('photo_') || key === 'research_private_data' ? 422 : key === 'research_rate_limited' ? 429 : 503 });
  }
}
