import { describe, expect, it } from "vitest";

import {
  filterOfferSubscribers,
  getOfferSubscriberStatus,
  canReactivateOfferSubscriber,
  serializeOfferSubscribersCsv,
  type OfferSubscriberRow,
} from "../offer-subscribers";

const rows: OfferSubscriberRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    email: "active@example.com",
    locale: "de",
    confirmed_at: "2026-08-29T10:00:00Z",
    confirmation_sent_at: "2026-08-29T09:55:00Z",
    unsubscribed_at: null,
    created_at: "2026-08-29T09:55:00Z",
    updated_at: "2026-08-29T10:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    email: "pending@example.com",
    locale: "en",
    confirmed_at: null,
    confirmation_sent_at: "2026-08-29T11:00:00Z",
    unsubscribed_at: null,
    created_at: "2026-08-29T11:00:00Z",
    updated_at: "2026-08-29T11:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    email: "old@example.com",
    locale: "de",
    confirmed_at: "2026-08-20T10:00:00Z",
    confirmation_sent_at: "2026-08-20T09:55:00Z",
    unsubscribed_at: "2026-08-28T12:00:00Z",
    created_at: "2026-08-20T09:55:00Z",
    updated_at: "2026-08-28T12:00:00Z",
  },
];

describe("offer subscribers", () => {
  it("classifies active, pending and unsubscribed consent states", () => {
    expect(getOfferSubscriberStatus(rows[0])).toBe("active");
    expect(getOfferSubscriberStatus(rows[1])).toBe("pending");
    expect(getOfferSubscriberStatus(rows[2])).toBe("unsubscribed");
  });

  it("filters by status and case-insensitive email query", () => {
    expect(filterOfferSubscribers(rows, { status: "active", query: "ACTIVE@" })).toEqual([rows[0]]);
    expect(filterOfferSubscribers(rows, { status: "pending", query: "" })).toEqual([rows[1]]);
    expect(filterOfferSubscribers(rows, { status: "all", query: "example.com" })).toHaveLength(3);
  });

  it("allows reactivation only after prior confirmation", () => {
    expect(canReactivateOfferSubscriber(rows[0])).toBe(false);
    expect(canReactivateOfferSubscriber(rows[1])).toBe(false);
    expect(canReactivateOfferSubscriber(rows[2])).toBe(true);
  });

  it("exports consent evidence without confirmation tokens and prevents CSV formulas", () => {
    const csv = serializeOfferSubscribersCsv([
      { ...rows[0], email: "=IMPORTXML(example.com)@example.com" },
    ]);
    expect(csv).toContain("email,locale,status,created_at,confirmation_sent_at,confirmed_at,unsubscribed_at,updated_at");
    expect(csv).toContain("'=IMPORTXML(example.com)@example.com");
    expect(csv).toContain("active");
    expect(csv).not.toContain("confirmation_token");
  });
});
