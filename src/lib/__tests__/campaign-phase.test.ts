import { describe, expect, it } from "vitest";

import { campaignStateFor, getCampaignPhase, isCampaignPagePublic } from "../seasonal-theme";

const phaseAt = (iso: string) => getCampaignPhase(new Date(iso));
const stateAt = (iso: string, mode: "auto" | "on" | "off", env = "") =>
  campaignStateFor(new Date(iso), mode, env);

describe("Black Week campaign phase", () => {
  it("keeps the landing page offline before the teaser window", () => {
    expect(phaseAt("2026-10-25T23:59:59+01:00")).toBe("off");
  });

  it("opens the teaser four weeks before the sale", () => {
    expect(phaseAt("2026-10-26T00:00:00+01:00")).toBe("before");
  });

  it("stays in the teaser phase until launch", () => {
    expect(phaseAt("2026-11-22T23:59:59+01:00")).toBe("before");
  });

  it("goes live when the sale starts", () => {
    expect(phaseAt("2026-11-23T00:00:00+01:00")).toBe("live");
  });

  it("stays live through Cyber Monday", () => {
    expect(phaseAt("2026-11-30T23:59:59+01:00")).toBe("live");
  });

  it("closes the page after the sale", () => {
    expect(phaseAt("2026-12-01T00:00:00+01:00")).toBe("after");
  });

  it("keeps auto on the calendar when no environment override exists", () => {
    const state = stateAt("2026-10-29T12:00:00+01:00", "auto");
    expect(state.phase).toBe("before");
    expect(state.theme).toBeNull();
    expect(state.source).toBe("calendar");
  });

  it("lets the environment start the theme during auto, before the sale", () => {
    const state = stateAt("2026-10-29T12:00:00+01:00", "auto", "black-friday");
    expect(state.phase).toBe("before");
    expect(state.theme?.id).toBe("black-friday");
    expect(state.source).toBe("env");
  });

  it("starts the theme immediately when staff enable it, without changing the teaser claims", () => {
    const state = stateAt("2026-10-29T12:00:00+01:00", "on");
    expect(state.phase).toBe("before");
    expect(state.theme?.id).toBe("black-friday");
    expect(state.source).toBe("admin");
  });

  it("keeps the enabled theme through the sale", () => {
    const state = stateAt("2026-11-25T12:00:00+01:00", "on");
    expect(state.phase).toBe("live");
    expect(state.theme?.id).toBe("black-friday");
  });

  it("turns the admin-enabled theme off after the window", () => {
    const state = stateAt("2026-12-01T00:00:00+01:00", "on");
    expect(state.phase).toBe("after");
    expect(state.theme).toBeNull();
  });

  it("disables theme and page even when the environment forces the campaign", () => {
    const state = stateAt("2026-11-25T12:00:00+01:00", "off", "black-friday");
    expect(state.phase).toBe("off");
    expect(state.theme).toBeNull();
    expect(state.source).toBe("admin");
  });

  it("keeps APFEL_SEASON=off as a hard kill switch for the admin switch", () => {
    const state = stateAt("2026-11-25T12:00:00+01:00", "on", "off");
    expect(state.phase).toBe("off");
    expect(state.theme).toBeNull();
  });

  it("only makes the page public in the teaser and live phases", () => {
    expect(isCampaignPagePublic("before")).toBe(true);
    expect(isCampaignPagePublic("live")).toBe(true);
    expect(isCampaignPagePublic("off")).toBe(false);
    expect(isCampaignPagePublic("after")).toBe(false);
  });
});
