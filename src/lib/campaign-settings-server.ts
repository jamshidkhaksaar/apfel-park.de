import { cache } from "react";

import { createAdminDbClient } from "@/lib/admin-db";

import type { AdminCampaignMode } from "./seasonal-theme";

export type CampaignSettings = {
  mode: AdminCampaignMode;
  updatedAt?: string;
};

export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = { mode: "auto" };

const normalizeMode = (value: unknown): AdminCampaignMode =>
  value === "on" || value === "off" ? value : "auto";

/**
 * The owner's campaign switch lives in `store_settings` so it needs no schema
 * change and can be edited under Admin -> Einstellungen. Missing rows mean
 * `auto`: the existing environment override and calendar still decide.
 */
export const getCampaignSettings = cache(async (): Promise<CampaignSettings> => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "campaign")
      .maybeSingle();

    const value = (data?.value ?? {}) as { mode?: unknown; updatedAt?: unknown };
    return {
      mode: normalizeMode(value.mode),
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    };
  } catch (error) {
    console.error("getCampaignSettings failed:", error);
    return DEFAULT_CAMPAIGN_SETTINGS;
  }
});
