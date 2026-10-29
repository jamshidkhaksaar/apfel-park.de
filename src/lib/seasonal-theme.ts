import { blackFriday } from "./black-friday";

export type SeasonalThemeId = "black-friday";

/**
 * `off`      — campaign switched off explicitly
 * `before`   — landing page is public, nothing is on sale yet
 * `live`     — sale window, the site-wide theme is active
 * `after`    — the sale is over, the landing page is gone again
 */
export type CampaignPhase = "off" | "before" | "live" | "after";

export type SeasonalTheme = {
  id: SeasonalThemeId;
  startsAt: string;
  endsAt: string;
  href: string;
  /** The campaign art direction needs the dark token set to work. */
  forcedTheme: "dark";
};

/** Stored in `store_settings.campaign` and edited under Admin -> Einstellungen. */
export type AdminCampaignMode = "auto" | "on" | "off";

/** Where the current campaign state came from. */
export type CampaignSource = "admin" | "env" | "calendar";

export type CampaignState = {
  mode: AdminCampaignMode;
  source: CampaignSource;
  phase: CampaignPhase;
  theme: SeasonalTheme | null;
};

export const seasonalThemes: readonly SeasonalTheme[] = [
  {
    id: "black-friday",
    startsAt: blackFriday.startsAt,
    endsAt: blackFriday.endsAt,
    href: blackFriday.href,
    forcedTheme: "dark",
  },
];

/**
 * `APFEL_SEASON` overrides the calendar:
 *   - `black-friday` forces the campaign on (previews, early staging)
 *   - `off` keeps every campaign off (measure the base site)
 *   - unset follows the date window
 * An unknown value fails closed rather than guessing.
 */
const seasonOverride = (process.env.APFEL_SEASON ?? "").trim().toLowerCase();

export const isSeasonOverrideActive = Boolean(seasonOverride);

/**
 * Preview-only switch for the landing page state: `before`, `live` or `after`.
 * Unset in production, where the calendar below decides. Unknown values are
 * ignored, so a typo cannot keep the sale open past its window.
 */
const phasePreview = (process.env.APFEL_CAMPAIGN_PHASE ?? "").trim().toLowerCase();

const previewPhase = (): CampaignPhase | null =>
  phasePreview === "before" || phasePreview === "live" || phasePreview === "after"
    ? phasePreview
    : null;

/**
 * The landing page is a teaser for four weeks before the sale. The site-wide
 * theme only takes over for the sale itself (`getActiveSeasonalTheme`).
 * Outside the teaser-to-end window the page must not exist at all.
 */
function campaignPhaseFor(now: Date, override: string): CampaignPhase {
  if (override === "off" || override === "none") return "off";

  const preview = previewPhase();
  if (preview) return preview;

  const forced = Boolean(override);
  const time = now.getTime();

  if (time < Date.parse(blackFriday.teaserStartsAt)) return forced ? "before" : "off";
  if (time < Date.parse(blackFriday.startsAt)) return "before";
  if (time <= Date.parse(blackFriday.endsAt)) return "live";
  return "after";
}

function seasonalThemeFor(now: Date, override: string): SeasonalTheme | null {
  if (override === "off" || override === "none") return null;
  if (override) {
    return seasonalThemes.find((theme) => theme.id === override) ?? null;
  }

  const time = now.getTime();
  return seasonalThemes.find(
    (theme) => time >= Date.parse(theme.startsAt) && time <= Date.parse(theme.endsAt),
  ) ?? null;
}

export function getCampaignPhase(now: Date = new Date()): CampaignPhase {
  return campaignPhaseFor(now, seasonOverride);
}

const blackFridayTheme =
  seasonalThemes.find((theme) => theme.id === "black-friday") ?? null;

/**
 * Resolves the campaign with the admin choice first:
 *
 *   `off`  -> nothing campaign-related, regardless of the environment.
 *   `on`   -> the campaign art direction from now on. The page and its sale
 *             claims still follow the calendar (teaser, live, after), and an
 *             `APFEL_SEASON=off` environment kill switch still wins. The theme
 *             switches itself off once the window has ended.
 *   `auto` -> `APFEL_SEASON` when set, otherwise the calendar.
 *
 * Keeping the phase calendar-driven means the “Black Week starts on 23.11.”
 * teaser can never turn into a sale claim just because staff flipped a switch.
 */
export function campaignStateFor(
  now: Date = new Date(),
  mode: AdminCampaignMode = "auto",
  envOverride: string = seasonOverride,
): CampaignState {
  const source: CampaignSource =
    mode === "auto" ? (envOverride ? "env" : "calendar") : "admin";

  if (mode === "off") return { mode, source, phase: "off", theme: null };

  const phase = campaignPhaseFor(now, envOverride);

  if (mode === "on") {
    const killed = envOverride === "off" || envOverride === "none";
    const theme = killed || phase === "after" ? null : blackFridayTheme;
    return { mode, source, phase, theme };
  }

  return { mode, source, phase, theme: seasonalThemeFor(now, envOverride) };
}

export const isCampaignPagePublic = (
  phase: CampaignPhase,
): phase is "before" | "live" => phase === "before" || phase === "live";

export function getActiveSeasonalTheme(now: Date = new Date()): SeasonalTheme | null {
  return seasonalThemeFor(now, seasonOverride);
}

/**
 * Countdown seed for the first client render. Kept in one place so server
 * components do not read the clock in their render body.
 */
export function secondsRemaining(endsAt: string, now: number = Date.now()): number {
  return Math.max(0, Date.parse(endsAt) - now);
}
