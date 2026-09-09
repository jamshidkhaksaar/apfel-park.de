import { sanitizeResearchResult, type ProductResearchResult } from '@/lib/product-research-core';
import { findSensitiveDataIssues } from '@/lib/product-intake/redaction';
import type { ResearchSource } from '@/lib/product-research-sources';
import { validatedGtin } from '@/lib/product-identifiers';

const normalized = (value: string): string => value.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]/g, '');
const sourceHas = (source: ResearchSource, value: string): boolean => value.trim().length > 2 && normalized(source.text).includes(normalized(value));

/** Preserve a manufacturer's optical-quality qualifier rather than upgrading it
 * to a claim about the lens's optical magnification.
 */
export const retainZoomQualifier = (text: string, sources: ResearchSource[]): string => {
  const factors = new Set<string>();
  for (const source of sources) for (const qualifier of source.text.matchAll(/optisch\w*\s+Qualität/gi)) {
    const preceding = source.text.slice(Math.max(0, qualifier.index - 90), qualifier.index);
    const factor = [...preceding.matchAll(/(?<![0-9.,])(\d{1,2})\s*(?:x|×|[-‑]?fach\w*)/gi)].at(-1);
    if (factor && !/[.!?]/.test(preceding.slice(factor.index + factor[0].length))) factors.add(factor[1]);
  }
  let result = text;
  for (const factor of factors) result = result.replace(new RegExp(`\\b${factor}\\s*(?:x|×|[-‑]?fach\\w*)\\s+optisch\\w*\\s+(?:Zoom|Vergrößerung)\\b`, 'gi'), `${factor}x Zoom in optischer Qualität`);
  return result;
};

/** Deterministic gates surround the editable AI draft; this is not certification. */
export const finalizeResearchedProduct = (
  raw: unknown,
  sources: ResearchSource[],
  context: { condition?: string; hints?: Record<string, unknown>; hardwareModel?: string },
): ProductResearchResult => {
  if (!sources.length) throw new Error('official_sources_unavailable');
  const research = sanitizeResearchResult(raw);
  if (!research.title || !research.description || !research.brand || !research.model) throw new Error('research_incomplete');
  const category = normalized(research.category ?? '');
  const categories: Record<string, string> = { smartphone: 'smartphones', smartphones: 'smartphones', phones: 'smartphones', tablet: 'tablets', tablets: 'tablets', accessories: 'accessories', zubehor: 'accessories', laptop: 'laptops', laptops: 'laptops', notebooks: 'laptops', consoles: 'consoles', konsolen: 'consoles' };
  research.category = categories[category];
  research.description = retainZoomQualifier(research.description, sources);
  research.subtitle = research.subtitle ? retainZoomQualifier(research.subtitle, sources) : undefined;
  research.features = research.features?.map(feature => retainZoomQualifier(feature, sources));
  research.specs = research.specs?.map(spec => ({ ...spec, value: retainZoomQualifier(spec.value, sources) }));
  if (/hypothetical|hypothetisch|expected to be released|not yet released|keine offiziellen informationen/i.test(research.description)) throw new Error('research_unverified_model');
  if (!/\b(der|die|das|und|mit|für|ist|sind|bietet|verfügt|einem|einer|dein|deine|sich|zum)\b/i.test(research.description)
      || /^(the|this)\s.+\b(is|has|offers|features)\b/i.test(research.description)) throw new Error('research_not_german');
  const warnings = [
    'KI-Vorschlag: Angaben anhand der verlinkten Herstellerquellen vor dem Speichern prüfen.',
    'GTIN, MPN, Preis, Bestand und Angaben zum konkreten Gerätezustand bleiben manuell zu bestätigen.',
  ];
  research.researchSources = sources.map(({ url, title, retrievedAt }) => ({ url, title, retrievedAt }));
  research.researchWarnings = warnings;
  research.variantSuggestions = research.variants?.map(({ color, storage }) => ({ color, storage }));
  // Manufacturer options are not stock offers, and search results are not licences.
  research.variants = undefined;
  research.gallery = [];
  research.gtinSuggestion = null;
  research.mpnSuggestion = null;
  research.skuSuggestion = null;
  research.eprelId = null;
  research.energyLabel = undefined;
  research.countryOfOrigin = undefined;
  research.refurbishmentSteps = undefined;
  research.campaignSuggestion = undefined;
  research.specs = research.specs?.filter(spec => !/eprel|energie(?:effizienz)?klasse|energy\s*(?:class|rating)|zertifikat|certificat|akkuzustand|battery health/i.test(spec.label));
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const evidence = Array.isArray(record.evidence) ? record.evidence : [];
  const citedSources = (field: string): ResearchSource[] => sources.filter(source => evidence.some(item => {
    if (!item || typeof item !== 'object') return false;
    const e = item as { field?: unknown; sourceUrl?: unknown };
    return e.field === field && e.sourceUrl === source.url;
  }));
  const hardware = context.hardwareModel?.trim();
  const regionalEvidence = hardware && citedSources('regionalSpecifications').some(source => sourceHas(source, hardware));
  if (!regionalEvidence) {
    const regionalClaim = /\b(?:e-?sim|nano.?sim|sim.?karte|sim.?card|\d+(?:[,.]\d+)?\s*(?:stunden|hours|gramm|grams|mAh|Wh))\b/i;
    research.specs = research.specs?.filter(spec => !/\b(?:sim|gewicht|weight|videowiedergabe|video playback|akkulaufzeit|battery endurance|mobilfunkband|cellular bands)\b/i.test(spec.label)
      && !regionalClaim.test(spec.value)
      && !(research.brand?.toLowerCase() === 'samsung' && /prozessor|processor|chip|soc\b/i.test(spec.label)));
    research.features = research.features?.filter(feature => !regionalClaim.test(feature));
    research.description = research.description.split(/(?<=[.!?])\s+/).filter(sentence => !regionalClaim.test(sentence)
      && !(research.brand?.toLowerCase() === 'samsung' && /exynos|snapdragon/i.test(sentence))).join(' ');
    if (!research.description) throw new Error('research_incomplete');
    if (research.dimensions) delete research.dimensions.weightG;
    if (research.batteryDetails) delete research.batteryDetails.wattHours;
    warnings.push('Regionale Hardwaredetails wie SIM-Ausführung, Gewicht und Akkulaufzeit wurden ohne passenden Gerätenachweis nicht übernommen.');
  }
  for (const field of ['manufacturer', 'euResponsiblePerson'] as const) {
    const party = research[field];
    const role = field === 'manufacturer' ? /\b(?:Hersteller|manufacturer)\b/i : /responsible\s*(?:person|economic operator)|verantwortliche\s*person|wirtschaftsakteur|eu\s*(?:representative|importer)/i;
    const verified = party && party.name && party.address && party.email && citedSources(field).some(source => role.test(source.text)
      && sourceHas(source, party.name!) && sourceHas(source, party.address!) && source.text.toLowerCase().includes(party.email!.toLowerCase()));
    if (!verified) research[field] = undefined;
  }
  if (!research.manufacturer || !research.euResponsiblePerson) warnings.push('GPSR: Nicht belegte Hersteller- oder EU-Verantwortlichenangaben bitte anhand von Verpackung bzw. Produktunterlagen ergänzen.');
  research.safetyWarnings = research.safetyWarnings?.filter(warning => citedSources('safetyWarnings').some(source => sourceHas(source, warning)));
  if (context.condition !== 'new' || !citedSources('batteryDetails').length) research.batteryDetails = undefined;
  if (context.condition !== 'new' || !citedSources('packageContents').length) research.packageContents = undefined;
  const hints = context.hints ?? {};
  const candidates = Array.isArray(hints.gtinCandidates) ? hints.gtinCandidates : [];
  const decoded = [...new Set(candidates.filter(item => item && typeof item === 'object' && item.extractionMethod === 'barcode' && item.checksumValid === true && item.autoAccept === true).map(item => String(item.value)))];
  if (decoded.length === 1) research.gtinSuggestion = validatedGtin(decoded[0]) ?? null;
  if (typeof hints.manufacturerPartNumber === 'string') research.mpnSuggestion = hints.manufacturerPartNumber;
  if (typeof hints.hardwareModel === 'string') research.hardwareModelSuggestion = hints.hardwareModel;
  if (research.variantSuggestions?.length) warnings.push('Herstelleroptionen sind Vorschläge, keine angebotenen Varianten und kein Lagerbestand.');
  if (findSensitiveDataIssues(research).length) throw new Error('research_private_data');
  return research;
};
