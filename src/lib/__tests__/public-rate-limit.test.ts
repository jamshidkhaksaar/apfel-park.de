import { describe, expect, it } from "vitest";

import { getTrustedClientIp } from "../public-rate-limit";

describe("getTrustedClientIp", () => {
  it("accepts a valid Nginx X-Real-IP", () => {
    expect(getTrustedClientIp(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("does not trust client-controlled forwarded chains or malformed addresses", () => {
    expect(getTrustedClientIp(new Headers({ "x-forwarded-for": "1.2.3.4" }))).toBe("unknown");
    expect(getTrustedClientIp(new Headers({ "x-real-ip": "not-an-ip" }))).toBe("unknown");
  });
});
