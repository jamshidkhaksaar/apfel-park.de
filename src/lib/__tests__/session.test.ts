import { beforeEach, describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "../session";

const secret = "s".repeat(64);

describe("admin session tokens", () => {
  beforeEach(() => {
    process.env.APP_SESSION_SECRET = secret;
    process.env.ADMIN_EMAILS = "admin@example.com";
  });

  it("expires signed role sessions after fourteen days", () => {
    const issued = new Date("2026-08-01T00:00:00.000Z");
    const token = createSessionToken("manager@example.com", "manager", issued);
    expect(verifySessionToken(token, new Date("2026-08-14T23:59:59.000Z"))).toMatchObject({ email: "manager@example.com", role: "manager" });
    expect(verifySessionToken(token, new Date("2026-08-15T00:00:01.000Z"))).toBeNull();
  });

  it("rejects future-issued and tampered tokens", () => {
    const token = createSessionToken("admin@example.com", "admin", new Date("2026-08-01T00:00:00.000Z"));
    expect(verifySessionToken(token, new Date("2026-07-31T23:50:00.000Z"))).toBeNull();
    expect(verifySessionToken(`${token}x`, new Date("2026-08-01T00:01:00.000Z"))).toBeNull();
  });
});
