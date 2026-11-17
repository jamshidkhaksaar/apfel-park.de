import { describe, expect, it } from "vitest";

import { blackWeekDates } from "../black-week-calendar";
import { campaignStateFor } from "../seasonal-theme";

describe("Black Week calendar", () => {
  it("keeps this year's published dates", () => {
    const d = blackWeekDates(2026);
    expect([d.teaserStartsAt, d.startsAt, d.endsAt, d.blackFriday]).toEqual([
      "2026-10-26T00:00:00+01:00", "2026-11-23T00:00:00+01:00", "2026-11-30T23:59:59+01:00", "2026-11-27",
    ]);
    expect(d.de.range).toBe("23.–30. November");
  });

  it("moves with Thanksgiving every year", () => {
    expect(blackWeekDates(2027).blackFriday).toBe("2027-11-26");
    expect(blackWeekDates(2027).de.range).toBe("22.–29. November");
    expect(blackWeekDates(2030).en.range).toBe("25 November – 2 December");
  });

  it("switches itself off after Black Week and on again next November", () => {
    const at = (iso: string, mode: "auto" | "on" | "off" = "auto") => campaignStateFor(new Date(iso), mode, "");
    expect(at("2026-11-25T12:00:00+01:00").phase).toBe("live");
    // Staff left the switch on: theme, page and prices still end with the week.
    const after = at("2026-12-05T12:00:00+01:00", "on");
    expect([after.phase, after.theme]).toEqual(["after", null]);
    expect(at("2027-03-01T12:00:00+01:00").phase).toBe("off");
    expect(at("2027-11-01T12:00:00+01:00").phase).toBe("before");
    expect(at("2027-11-24T12:00:00+01:00").phase).toBe("live");
    expect(at("2027-11-24T12:00:00+01:00", "off").phase).toBe("off");
  });
});
