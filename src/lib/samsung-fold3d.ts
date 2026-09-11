// Shared data for the official Samsung Galaxy Z Fold8 / Z Fold8 Ultra 3D
// showcase. Assets are self-hosted under public/images/samsung/zfold8/viewer
// and were fetched with scripts/fetch-samsung-fold-assets.mjs.
//
// The official viewer config (config/*.json) drives per-finish colours,
// material options and HDR environment maps. Types mirror that file.

export const SAMSUNG_FOLD3D_BASE = "/images/samsung/zfold8/viewer";

export type SamsungModelId = "fold8" | "ultra";

export type SamsungFinish = {
  /** Official config colour key (e.g. "violet-shadow"). */
  id: string;
  nameDe: string;
  nameEn: string;
  /** Official finish colour from Samsung's viewer config. */
  colorHex: string;
  badgeDe: string;
  badgeEn: string;
};

export const SAMSUNG_MODEL_LABEL: Record<SamsungModelId, string> = {
  fold8: "Galaxy Z Fold8",
  ultra: "Galaxy Z Fold8 Ultra",
};

export const SAMSUNG_MODEL_CONFIG: Record<SamsungModelId, { configKey: string; glb: string; configUrl: string }> = {
  fold8: {
    configKey: "galaxy-z-fold8",
    glb: `${SAMSUNG_FOLD3D_BASE}/models/galaxy-z-fold8.glb`,
    configUrl: `${SAMSUNG_FOLD3D_BASE}/config/galaxy-z-fold8.json`,
  },
  ultra: {
    configKey: "galaxy-z-fold8-ultra",
    glb: `${SAMSUNG_FOLD3D_BASE}/models/galaxy-z-fold8-ultra.glb`,
    configUrl: `${SAMSUNG_FOLD3D_BASE}/config/galaxy-z-fold8-ultra.json`,
  },
};

export const SAMSUNG_FOLD8_FINISHES: SamsungFinish[] = [
  {
    id: "pistachio",
    nameDe: "Pistachio",
    nameEn: "Pistachio",
    colorHex: "#ABC4C0",
    badgeDe: "Exklusiv-Farbe 2026",
    badgeEn: "Exclusive Edition 2026",
  },
  {
    id: "lavender",
    nameDe: "Lavender",
    nameEn: "Lavender",
    colorHex: "#BCB7CA",
    badgeDe: "Sanfte Eleganz",
    badgeEn: "Soft Elegance",
  },
  {
    id: "cream",
    nameDe: "Cream",
    nameEn: "Cream",
    colorHex: "#F1F1EE",
    badgeDe: "Klassisches Warmweiß",
    badgeEn: "Classic Warm White",
  },
  {
    id: "graphite",
    nameDe: "Graphite",
    nameEn: "Graphite",
    colorHex: "#5F6367",
    badgeDe: "Mattes Tiefgrau",
    badgeEn: "Matte Deep Grey",
  },
];

export const SAMSUNG_ULTRA_FINISHES: SamsungFinish[] = [
  {
    id: "violet-shadow",
    nameDe: "Violet Shadow Titanium",
    nameEn: "Violet Shadow Titanium",
    colorHex: "#686884",
    badgeDe: "Flaggschiff-Finish",
    badgeEn: "Flagship Finish",
  },
  {
    id: "graphite",
    nameDe: "Graphite Titanium",
    nameEn: "Graphite Titanium",
    colorHex: "#5F6367",
    badgeDe: "Grade 5 Titan",
    badgeEn: "Grade 5 Titanium",
  },
  {
    id: "cream",
    nameDe: "Cream Titanium",
    nameEn: "Cream Titanium",
    colorHex: "#F1F1EE",
    badgeDe: "Reflexionsarm",
    badgeEn: "Anti-Reflective",
  },
  {
    id: "green-shadow",
    nameDe: "Green Shadow Titanium",
    nameEn: "Green Shadow Titanium",
    colorHex: "#ABC4C0",
    badgeDe: "Boutique Edition",
    badgeEn: "Boutique Edition",
  },
];

export const SAMSUNG_FINISHES: Record<SamsungModelId, SamsungFinish[]> = {
  fold8: SAMSUNG_FOLD8_FINISHES,
  ultra: SAMSUNG_ULTRA_FINISHES,
};

/** Official HDR environment map filenames (config env type -> local file). */
export const SAMSUNG_HDR_FILES: Record<string, string> = {
  cameraDisplayZ8: "env-map-camera-display-z8.hdr",
  metalFold8: "env-metal-fold8.hdr",
  hingeFold8: "env-hinge-fold8.hdr",
  panelFold8: "env-panel-fold8.hdr",
  cameraFold8: "env-camera-fold8.hdr",
  logoFold8: "env-logo-fold8.hdr",
  metalFold8Ultra: "env-metal-fold8-ultra.hdr",
  hingeFold8Ultra: "env-hinge-fold8-ultra.hdr",
  panelFold8Ultra: "env-panel-fold8-ultra.hdr",
  cameraFold8Ultra: "env-camera-fold8-ultra.hdr",
  logoFold8Ultra: "env-logo-fold8-ultra.hdr",
};

export const samsungHdrUrl = (type: string): string | null => {
  const file = SAMSUNG_HDR_FILES[type];
  return file ? `${SAMSUNG_FOLD3D_BASE}/textures/hdr/${file}` : null;
};

export const samsungScreenTextureUrl = (model: SamsungModelId, side: "main" | "front", finishKey: string): string =>
  `${SAMSUNG_FOLD3D_BASE}/textures/${SAMSUNG_MODEL_CONFIG[model].configKey}/${side}-${finishKey}.jpg`;

export const samsungPosterUrl = (model: SamsungModelId, finishKey: string): string =>
  `${SAMSUNG_FOLD3D_BASE}/posters/${SAMSUNG_MODEL_CONFIG[model].configKey}/${finishKey}.jpg`;

export const SAMSUNG_DRACO_PATH = `${SAMSUNG_FOLD3D_BASE}/draco/`;

// ---------------------------------------------------------------------------
// Official viewer config types (subset of config/*.json)
// ---------------------------------------------------------------------------

export type SamsungCustomMaterialOption = {
  target: string[];
  options: Record<string, string | number | boolean>;
};

export type SamsungEnvCustom = {
  type: string;
  target?: string[];
};

export type SamsungColorConfig = {
  key: string;
  text: string;
  color: string;
  default: boolean;
  glb: string;
  envtype: string;
  envCustom: SamsungEnvCustom[];
  custumMaterial: SamsungCustomMaterialOption[];
};

export type SamsungModelConfig = {
  name: string;
  scale: number;
  color: SamsungColorConfig[];
};

export type SamsungViewerConfig = Record<string, SamsungModelConfig>;
