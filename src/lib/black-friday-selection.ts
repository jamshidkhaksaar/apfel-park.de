import { cache } from "react";

import { parseCampaignDiscounts, type CampaignDiscount } from "@/lib/campaign-pricing";
import { createDbClient } from "@/lib/db";

export type BlackFridaySelection = {
  /** Products staff explicitly added to the landing page. */
  pageIds: string[];
  /** Products that should lead the home and landing hero. */
  heroIds: string[];
  /** Per-product Black Friday discount, applied at read time while the sale is live. */
  discounts: Record<string, CampaignDiscount>;
  updatedAt?: string;
};

export const EMPTY_BLACK_FRIDAY_SELECTION: BlackFridaySelection = {
  pageIds: [],
  heroIds: [],
  discounts: {},
};

const uniqueIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))].slice(0, 60)
    : [];

/**
 * Campaign curation lives in `store_settings` so it survives product imports
 * and needs no schema change. Missing settings mean "automatic": the deal query
 * falls back to the biggest current savings.
 */
export const getBlackFridaySelection = cache(async (): Promise<BlackFridaySelection> => {
  try {
    const db = createDbClient();
    const { data } = await db
      .from<{ value: unknown }>("store_settings")
      .select("value")
      .eq("key", "black_friday_selection")
      .maybeSingle();
    if (!data?.value || typeof data.value !== "object") return EMPTY_BLACK_FRIDAY_SELECTION;
    const value = data.value as { pageIds?: unknown; heroIds?: unknown; discounts?: unknown; updatedAt?: unknown };
    return {
      pageIds: uniqueIds(value.pageIds),
      heroIds: uniqueIds(value.heroIds),
      discounts: parseCampaignDiscounts(value.discounts),
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    };
  } catch (error) {
    console.error("getBlackFridaySelection failed:", error);
    return EMPTY_BLACK_FRIDAY_SELECTION;
  }
});
