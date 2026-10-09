import type { ProductResearchResult } from '@/lib/product-research-core';
import type { ProductPayload } from '@/lib/product-write-payload';
import { appliedResearchTextFields } from '@/lib/product-ai-fields';
import { sanitizeProductExperienceProfile } from '@/lib/product-experience';
import type { PhoneDocument } from './model';

/** Manufacturer options are suggestions, never invented stock offers. */
export const applyEditorResearch = (doc: PhoneDocument, result: ProductResearchResult): PhoneDocument => {
  const current = { ...doc.shared, ...doc.pendingShared };
  const patch: ProductPayload = {};
  for (const key of ['title', 'subtitle', 'brand', 'model', 'category', 'description', 'specs', 'manufacturer', 'euResponsiblePerson', 'safetyWarnings', 'eprelId', 'energyLabel', 'batteryDetails', 'countryOfOrigin', 'chargerIncluded', 'chargingPowerMinW', 'chargingPowerMaxW', 'usbPdSupported', 'faq'] as const) {
    const value = result[key];
    if (value !== undefined && value !== null && value !== '') Object.assign(patch, { [key]: value });
  }
  if (result.features?.length) patch.featureBullets = result.features;
  for (const party of ['manufacturer', 'euResponsiblePerson', 'energyLabel', 'batteryDetails'] as const) {
    if (patch[party]) Object.assign(patch, { [party]: { ...current[party], ...Object.fromEntries(Object.entries(patch[party]!).filter(([, value]) => value !== undefined && value !== '')) } });
  }
  return {
    ...doc,
    pendingShared: { ...current, ...patch, aiGeneratedFields: appliedResearchTextFields(current.aiGeneratedFields, result) },
    pendingSpecsText: result.specs?.length ? undefined : doc.pendingSpecsText,
    researchGallery: result.gallery?.length ? result.gallery : doc.researchGallery,
    variantSuggestions: result.variantSuggestions ?? result.variants?.map(({ color, storage }) => ({ color, storage })) ?? doc.variantSuggestions,
    entries: doc.entries.map(entry => {
      const profile = sanitizeProductExperienceProfile(entry.experience);
      return {
        ...entry,
        experience: {
          ...profile,
          dimensions: { ...profile.dimensions, ...Object.fromEntries(Object.entries(result.dimensions ?? {}).filter(([, value]) => value !== undefined)) },
          // Box contents describe the actual offer. Only seed an empty proposal.
          packageContents: profile.packageContents.length ? profile.packageContents : result.packageContents ?? [],
          refurbishmentSteps: profile.refurbishmentSteps.length ? profile.refurbishmentSteps : result.refurbishmentSteps ?? [],
          campaign: result.campaignSuggestion ? { ...profile.campaign, ...result.campaignSuggestion } : profile.campaign,
        },
      };
    }),
  };
};
