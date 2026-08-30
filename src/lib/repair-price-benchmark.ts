export type RepairBenchmarkPrice = {
  standardDisplay?: number;
  premiumDisplay?: number;
  originalDisplay?: number;
  oemBattery?: number;
  backcover?: number;
};

export type RepairBenchmarkModel = {
  model: string;
  prices: Record<"apfelPark" | "ismart" | "myMobileRepair" | "phoneHelden", RepairBenchmarkPrice>;
};

export const isRepairBenchmarkPublished = (
  value = process.env.REPAIR_PRICE_COMPARISON_VERIFIED,
): boolean => value === "true";

export const repairBenchmark = {
  checkedAt: "2026-08-29",
  shops: {
    apfelPark: {
      name: "Apfel Park",
      url: "https://apfel-park.de/de/repairs",
    },
    ismart: {
      name: "iSmart Repair",
      url: "https://www.ismart-repair.de/reparaturen/",
    },
    myMobileRepair: {
      name: "My Mobile Repair",
      url: "https://www.mymobilerepair.de/iphone-reparatur-hamburg/",
    },
    phoneHelden: {
      name: "PhoneHelden",
      url: "https://phonehelden.de/",
    },
  },
  models: [
    {
      model: "iPhone 16 Pro Max",
      prices: {
        apfelPark: { standardDisplay: 125.1, premiumDisplay: 179.1, originalDisplay: 314.1, oemBattery: 71.1, backcover: 89.1 },
        ismart: { standardDisplay: 139, premiumDisplay: 199, originalDisplay: 349, oemBattery: 79, backcover: 99 },
        myMobileRepair: { standardDisplay: 159, premiumDisplay: 269, originalDisplay: 369, oemBattery: 79, backcover: 119 },
        phoneHelden: { standardDisplay: 250, premiumDisplay: 250, originalDisplay: 380, oemBattery: 120, backcover: 150 },
      },
    },
    {
      model: "iPhone 15 Pro Max",
      prices: {
        apfelPark: { standardDisplay: 89.1, premiumDisplay: 152.1, originalDisplay: 269.1, oemBattery: 62.1, backcover: 89.1 },
        ismart: { standardDisplay: 99, premiumDisplay: 169, originalDisplay: 299, oemBattery: 69, backcover: 99 },
        myMobileRepair: { standardDisplay: 119, premiumDisplay: 189, originalDisplay: 319, oemBattery: 69, backcover: 109 },
        phoneHelden: { standardDisplay: 230, premiumDisplay: 230, originalDisplay: 340, oemBattery: 90, backcover: 140 },
      },
    },
    {
      model: "iPhone 14 Pro",
      prices: {
        apfelPark: { standardDisplay: 80.1, premiumDisplay: 134.1, originalDisplay: 206.1, oemBattery: 53.1 },
        ismart: { standardDisplay: 89, premiumDisplay: 149, originalDisplay: 229, oemBattery: 59, backcover: 99 },
        myMobileRepair: { standardDisplay: 109, premiumDisplay: 169, originalDisplay: 239, oemBattery: 69, backcover: 109 },
        phoneHelden: { standardDisplay: 200, premiumDisplay: 200, originalDisplay: 290, oemBattery: 90, backcover: 120 },
      },
    },
    {
      model: "iPhone 13 Pro",
      prices: {
        apfelPark: { standardDisplay: 71.1, premiumDisplay: 116.1, originalDisplay: 179.1, oemBattery: 53.1 },
        ismart: { standardDisplay: 79, premiumDisplay: 129, originalDisplay: 199, oemBattery: 59, backcover: 99 },
        myMobileRepair: { standardDisplay: 99, premiumDisplay: 139, originalDisplay: 189, oemBattery: 69, backcover: 99 },
        phoneHelden: { standardDisplay: 150, premiumDisplay: 150, originalDisplay: 260, oemBattery: 90, backcover: 100 },
      },
    },
    {
      model: "iPhone 12",
      prices: {
        apfelPark: { standardDisplay: 62.1, premiumDisplay: 89.1, originalDisplay: 134.1, oemBattery: 53.1 },
        ismart: { standardDisplay: 69, premiumDisplay: 99, originalDisplay: 149, oemBattery: 59, backcover: 79 },
        myMobileRepair: { standardDisplay: 89, premiumDisplay: 129, originalDisplay: 149, oemBattery: 59, backcover: 89 },
        phoneHelden: { standardDisplay: 100, premiumDisplay: 130, originalDisplay: 190, oemBattery: 80, backcover: 90 },
      },
    },
  ] satisfies RepairBenchmarkModel[],
} as const;

export const repairBenchmarkFields = [
  { key: "standardDisplay", de: "Display Standard / Copy", en: "Standard / Copy display" },
  { key: "premiumDisplay", de: "Display Premium / Soft OLED", en: "Premium / Soft OLED display" },
  { key: "originalDisplay", de: "Display Original", en: "Original display" },
  { key: "oemBattery", de: "Akku OEM / Premium", en: "OEM / Premium battery" },
  { key: "backcover", de: "Rückglas / Backcover", en: "Rear glass / back cover" },
] as const;
