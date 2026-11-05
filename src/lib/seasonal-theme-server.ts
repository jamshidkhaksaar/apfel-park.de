import { cache } from "react";

import { getCampaignSettings } from "./campaign-settings-server";
import { campaignStateFor, type CampaignState } from "./seasonal-theme";

/**
 * One resolved campaign state per request: server components ask for the theme
 * and the page phase separately, but the settings row is read only once.
 */
export const getEffectiveCampaign = cache(async (): Promise<CampaignState> => {
  const settings = await getCampaignSettings();
  return campaignStateFor(new Date(), settings.mode);
});
