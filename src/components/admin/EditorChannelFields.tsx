'use client';
import { ProductChannelFields } from './ProductChannelFields';
import type { ProductPayload } from '@/lib/product-write-payload';
import { createEmptyProductChannelFields, productChannelPayload, type ProductChannelFieldState } from '@/lib/product-channel-form';

export default function EditorChannelFields({ locale, value, onChange }: {
  locale: 'de' | 'en'; value: ProductPayload; onChange: (patch: ProductPayload) => void;
}) {
  const tri = (value: boolean | null | undefined) => value == null ? '' : value ? 'yes' : 'no';
  const number = (value: number | null | undefined) => value == null ? '' : String(value);
  const fields: ProductChannelFieldState = {
    ...createEmptyProductChannelFields(), identifierStatus: value.identifierStatus ?? 'unknown',
    asin: value.asin ?? '', ebayEpid: value.ebayEpid ?? '', countryOfOrigin: value.countryOfOrigin ?? '',
    packageWeightKg: number(value.packageWeightKg), packageLengthCm: number(value.packageLengthCm), packageWidthCm: number(value.packageWidthCm), packageHeightCm: number(value.packageHeightCm),
    batteryIncluded: tri(value.batteryDetails?.included), batteryCellComposition: value.batteryDetails?.cellComposition ?? '', batteryCount: number(value.batteryDetails?.count), batteryWeightGrams: number(value.batteryDetails?.weightGrams), batteryWattHours: number(value.batteryDetails?.wattHours), batteryUnNumber: value.batteryDetails?.unNumber ?? '',
    chargerIncluded: tri(value.chargerIncluded), chargingPowerMinW: number(value.chargingPowerMinW), chargingPowerMaxW: number(value.chargingPowerMaxW), usbPdSupported: tri(value.usbPdSupported),
    googleProductCategory: value.marketplaceCategoryMappings?.google?.category ?? '',
    ebayCategoryId: value.marketplaceCategoryMappings?.ebay_de?.categoryId ?? '', ebayCategoryName: value.marketplaceCategoryMappings?.ebay_de?.categoryName ?? '', ebayRequiredAspects: value.marketplaceCategoryMappings?.ebay_de?.requiredAspects ?? [], ebayAspects: value.marketplaceAttributes?.ebay_de ?? {},
    amazonProductType: value.marketplaceCategoryMappings?.amazon_de?.productType ?? '', amazonGtinExemption: Boolean(value.amazonGtinExemption), amazonRenewedApproved: Boolean(value.amazonRenewedApproved),
  };
  return <ProductChannelFields locale={locale} category={value.category ?? 'smartphones'} condition={value.condition ?? 'new'} value={fields} onChange={next => { const patch = productChannelPayload(next); onChange({ ...patch, marketplaceAttributes: { ...patch.marketplaceAttributes, ...(value.marketplaceAttributes?.amazon_de ? { amazon_de: value.marketplaceAttributes.amazon_de } : {}) } }); }} />;
}
