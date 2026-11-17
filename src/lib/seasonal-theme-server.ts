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

/**
 * Black Friday tools in the admin (deal column, editor box, Black Week panel)
 * only exist while a campaign is coming up or running and the switch is not
 * "off". After Black Week they disappear until next year's teaser.
 */
export const isBlackFridayAdminActive = async (): Promise<boolean> => {
  const campaign = await getEffectiveCampaign();
  return campaign.mode !== "off" && (campaign.phase === "before" || campaign.phase === "live");
};
