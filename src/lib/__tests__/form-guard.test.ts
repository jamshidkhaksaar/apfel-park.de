import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkGuardToken, encodeGuardToken, GUARD_MIN_FILL_MS, isGuardToken } from "@/lib/form-guard";

const rateLimit = vi.hoisted(() => ({ allowed: true }));
vi.mock("@/lib/public-rate-limit", () => ({
  consumePublicRateLimit: vi.fn(async () => ({ allowed: rateLimit.allowed, retryAfter: 60 })),
}));
vi.mock("@/lib/admin-db", () => ({
  createAdminDbClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: { enabled: true, siteKey: "k", secretKey: "s" } }, error: null }) }) }) }),
  }),
}));

describe("cookie-free form guard", () => {
  it("encodes fill time and trap field", () => {
    expect(encodeGuardToken(4200.4, false)).toBe("guard.v1.4200.0");
    expect(encodeGuardToken(-5, true)).toBe("guard.v1.0.1");
    expect(isGuardToken("guard.v1.4200.0")).toBe(true);
    expect(isGuardToken("03AFcWeA...")).toBe(false);
  });

  it("accepts a person and rejects bots", () => {
    expect(checkGuardToken(encodeGuardToken(GUARD_MIN_FILL_MS + 500, false), "Ist das iPhone noch da?")).toEqual({ ok: true });
    expect(checkGuardToken(encodeGuardToken(9000, true))).toEqual({ ok: false, reason: "trap" });
    expect(checkGuardToken(encodeGuardToken(800, false))).toEqual({ ok: false, reason: "too_fast" });
    expect(checkGuardToken(encodeGuardToken(9000, false), "http://a.ru http://b.ru www.c.ru")).toEqual({ ok: false, reason: "links" });
    expect(checkGuardToken("guard.v1.abc.0")).toEqual({ ok: false, reason: "malformed" });
  });
});

describe("verifyReCaptcha with the guard", () => {
  beforeEach(() => {
    rateLimit.allowed = true;
  });
  const headers = new Headers({ "x-real-ip": "203.0.113.7" });

  it("accepts a guard proof only where the form allows it", async () => {
    const { verifyReCaptcha } = await import("@/lib/recaptcha");
    const token = encodeGuardToken(6000, false);
    expect((await verifyReCaptcha(token, "contact_form", { allowGuard: true, headers, scope: "contact", text: "Hallo" })).success).toBe(true);
    // admin login and other places do not opt in
    expect((await verifyReCaptcha(token, "admin_login")).success).toBe(false);
  });

  it("rejects bots and enforces the stricter send limit", async () => {
    const { verifyReCaptcha } = await import("@/lib/recaptcha");
    const options = { allowGuard: true as const, headers, scope: "contact" };
    expect((await verifyReCaptcha(encodeGuardToken(6000, true), "contact_form", options)).success).toBe(false);
    expect((await verifyReCaptcha(encodeGuardToken(500, false), "contact_form", options)).success).toBe(false);
    rateLimit.allowed = false;
    expect((await verifyReCaptcha(encodeGuardToken(6000, false), "contact_form", options))).toMatchObject({ success: false, error: "Too many requests" });
  });

  it("still rejects an empty token when reCAPTCHA is enabled", async () => {
    const { verifyReCaptcha } = await import("@/lib/recaptcha");
    expect((await verifyReCaptcha("", "contact_form", { allowGuard: true, headers, scope: "contact" })).success).toBe(false);
  });
});
