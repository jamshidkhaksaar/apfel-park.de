/**
 * Helpers for EPREL, the EU's public product register.
 *
 * Two details here are easy to get wrong and are therefore kept in one place:
 *
 *  - The product group is versioned. "smartphonestablets2023" returns 404; the
 *    group for EU 2023/1669 is "smartphonestablets20231669".
 *  - The register reports the battery cycle count in *hundreds*. The API
 *    returns 10 for the iPhone 17 while the official label prints 1000, and
 *    register-wide the values cluster on 8 (the 800-cycle legal minimum) and
 *    10, which confirms the unit.
 */
export const EPREL_PRODUCT_GROUP = "smartphonestablets20231669";

export const eprelProductUrl = (registrationNumber: string): string =>
  `https://eprel.ec.europa.eu/screen/product/${EPREL_PRODUCT_GROUP}/${registrationNumber}`;

export type EprelAssetRoutes = {
  labelImage: string;
  ficheDe: string;
  ficheEn: string;
};

/** Deterministic routes used for official EPREL files mirrored in /public. */
export const eprelAssetRoutes = (registrationNumber: string): EprelAssetRoutes => ({
  labelImage: `/energy-labels/Label_${registrationNumber}.png`,
  ficheDe: `/energy-labels/Fiche_${registrationNumber}_DE.pdf`,
  ficheEn: `/energy-labels/Fiche_${registrationNumber}_EN.pdf`,
});

/** Register value (hundreds of cycles) to the number printed on the label. */
export const eprelCycles = (registerValue: number | null | undefined): number | undefined =>
  typeof registerValue === "number" && Number.isFinite(registerValue) && registerValue > 0
    ? Math.round(registerValue) * 100
    : undefined;

/** Endurance in minutes to "41 h 0 min", the wording the official label uses. */
export const eprelEndurance = (minutes: number | null | undefined): string | undefined => {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) return undefined;
  const whole = Math.round(minutes);
  return `${Math.floor(whole / 60)} h ${whole % 60} min`;
};
