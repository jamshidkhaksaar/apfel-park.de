import type { ProductResearchResult } from '@/lib/product-research-core';
import type { ProductPayload } from '@/lib/product-write-payload';
import { appliedResearchTextFields } from '@/lib/product-ai-fields';
import { sanitizeProductExperienceProfile } from '@/lib/product-experience';
import { buildAutoProductExperience } from '@/lib/product-experience-autofill';
import { isResearchPlaceholder, type PhoneDocument } from './model';

/** Manufacturer options are suggestions, never invented stock offers. */
export const applyEditorResearch = (doc: PhoneDocument, result: ProductResearchResult): PhoneDocument => {
  const current = { ...doc.shared, ...doc.pendingShared };
  const patch: ProductPayload = {};
  for (const key of ['title', 'subtitle', 'brand', 'model', 'hardwareModel', 'category', 'description', 'specs', 'manufacturer', 'euResponsiblePerson', 'safetyWarnings', 'eprelId', 'energyLabel', 'batteryDetails', 'countryOfOrigin', 'chargerIncluded', 'chargingPowerMinW', 'chargingPowerMaxW', 'usbPdSupported', 'faq'] as const) {
    const value = result[key];
    if (value !== undefined && value !== null && value !== '') Object.assign(patch, { [key]: value });
  }
  if (result.features?.length) patch.featureBullets = result.features;
  for (const party of ['manufacturer', 'euResponsiblePerson', 'energyLabel', 'batteryDetails'] as const) {
    if (patch[party]) Object.assign(patch, { [party]: { ...current[party], ...Object.fromEntries(Object.entries(patch[party]!).filter(([, value]) => value !== undefined && value !== '')) } });
  }
  const mergedShared = { ...current, ...patch, aiGeneratedFields: appliedResearchTextFields(current.aiGeneratedFields, result) };
  const variantSuggestions = result.variantSuggestions ?? result.variants?.map(({ color, storage, configuration }) => ({ color, storage, configuration })) ?? doc.variantSuggestions;
  const hasVariants = (variantSuggestions?.length ?? 0) > 0;
  const gallery = result.gallery?.length ? result.gallery.slice(0, 4) : (doc.researchGallery ?? []);

  return {
    ...doc,
    pendingShared: mergedShared,
    pendingSpecsText: result.specs?.length ? undefined : doc.pendingSpecsText,
    researchGallery: gallery.length ? gallery : doc.researchGallery,
    variantSuggestions,
    entries: doc.entries.map(entry => {
      const profile = sanitizeProductExperienceProfile(entry.experience);
      const mergedDimensions = {
        ...profile.dimensions,
        ...Object.fromEntries(Object.entries(result.dimensions ?? {}).filter(([, value]) => value !== undefined)),
      };
      const mergedCampaign = result.campaignSuggestion
        ? { ...profile.campaign, ...result.campaignSuggestion }
        : profile.campaign;
      const mergedPackageContents = profile.packageContents.length
        ? profile.packageContents
        : (result.packageContents?.length ? result.packageContents : result.experienceSuggestion?.packageContents ?? []);

      const experience = buildAutoProductExperience({
        category: result.category ?? mergedShared.category,
        brand: result.brand ?? mergedShared.brand,
        model: result.model ?? mergedShared.model,
        title: result.title ?? mergedShared.title,
        condition: entry.condition,
        specs: result.specs ?? mergedShared.specs,
        dimensions: mergedDimensions,
        packageContents: mergedPackageContents,
        chargerIncluded: result.chargerIncluded ?? mergedShared.chargerIncluded,
        chargingPowerMaxW: result.chargingPowerMaxW ?? mergedShared.chargingPowerMaxW,
        usbPdSupported: result.usbPdSupported ?? mergedShared.usbPdSupported,
        batteryDetails: result.batteryDetails ?? mergedShared.batteryDetails,
        campaign: mergedCampaign,
        comparisonProductIds: result.experienceSuggestion?.comparisonProductIds,
        existing: {
          ...profile,
          dimensions: mergedDimensions,
          packageContents: mergedPackageContents,
          refurbishmentSteps: profile.refurbishmentSteps.length
            ? profile.refurbishmentSteps
            : (result.refurbishmentSteps?.length ? result.refurbishmentSteps : result.experienceSuggestion?.refurbishmentSteps ?? []),
          conditionGuide: profile.conditionGuide.length
            ? profile.conditionGuide
            : (result.experienceSuggestion?.conditionGuide ?? []),
          trustPoints: profile.trustPoints.length
            ? profile.trustPoints
            : (result.experienceSuggestion?.trustPoints ?? []),
          comparisonProductIds: profile.comparisonProductIds.length
            ? profile.comparisonProductIds
            : (result.experienceSuggestion?.comparisonProductIds ?? []),
          campaign: mergedCampaign,
        },
        preserveEmptyPackageContentsForUsed: Boolean(doc.telegramSessionId),
      });

      const placeholder = isResearchPlaceholder(entry, mergedShared);
      const shouldAutoFillPhotos =
        entry.condition === 'new'
        && gallery.length > 0
        && entry.photos.every(p => !p.url)
        && (!placeholder || !hasVariants);

      const photos = shouldAutoFillPhotos
        ? gallery.map((url, idx) => ({ id: entry.photos[idx]?.id ?? crypto.randomUUID(), url }))
        : entry.photos;
      const coverId = shouldAutoFillPhotos ? photos[0]?.id ?? entry.coverId : entry.coverId;

      return {
        ...entry,
        photos,
        coverId,
        experience,
      };
    }),
  };
};
