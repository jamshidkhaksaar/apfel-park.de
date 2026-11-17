import { afterEach, describe, expect, it, vi } from "vitest";

const settings = vi.hoisted(() => ({ value: { mode: "off", adminTools: "auto" } as { mode: string; adminTools: string } }));

vi.mock("react", () => ({ cache: <T,>(fn: T) => fn }));
vi.mock("@/lib/campaign-settings-server", () => ({ getCampaignSettings: async () => settings.value }));
vi.mock("../campaign-settings-server", () => ({ getCampaignSettings: async () => settings.value }));

import { isBlackFridayAdminActive } from "../seasonal-theme-server";

describe("Black Friday admin menus", () => {
  afterEach(() => vi.useRealTimers());

  it("show during the teaser even while the shop theme is switched off", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-18T12:00:00+01:00") });
    settings.value = { mode: "off", adminTools: "auto" };
    expect(await isBlackFridayAdminActive()).toBe(true);
  });

  it("disappear after Black Week on auto, but can be forced on or off", async () => {
    vi.useFakeTimers({ now: new Date("2026-12-10T12:00:00+01:00") });
    settings.value = { mode: "auto", adminTools: "auto" };
    expect(await isBlackFridayAdminActive()).toBe(false);
    settings.value = { mode: "off", adminTools: "on" };
    expect(await isBlackFridayAdminActive()).toBe(true);
    vi.useFakeTimers({ now: new Date("2026-11-25T12:00:00+01:00") });
    settings.value = { mode: "on", adminTools: "off" };
    expect(await isBlackFridayAdminActive()).toBe(false);
  });
});
