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
 * Black Friday tools in the admin (deal column, editor box, Black Week panel).
 * Controlled by their own setting (Admin -> Einstellungen), separate from the
 * shop theme. On `auto` they show from the teaser start until Cyber Monday
 * and disappear afterwards until next year's teaser.
 */
export const isBlackFridayAdminActive = async (): Promise<boolean> => {
  const settings = await getCampaignSettings();
  if (settings.adminTools === "on") return true;
  if (settings.adminTools === "off") return false;
  // auto: follow the calendar, regardless of the shop theme switch, so staff
  // can prepare prices while customers still see the normal shop.
  const phase = campaignStateFor(new Date(), "auto").phase;
  return phase === "before" || phase === "live";
};
