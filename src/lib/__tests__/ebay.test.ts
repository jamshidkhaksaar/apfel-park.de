import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  buildEbayConsentUrl,
  createEbayNotificationChallengeResponse,
  createEbayOAuthState,
  decryptEbayToken,
  encryptEbayToken,
  verifyEbayOAuthState,
} from "../marketplaces/ebay";

const originalEnvironment = {
  APP_SESSION_SECRET: process.env.APP_SESSION_SECRET,
  EBAY_SANDBOX_CLIENT_ID: process.env.EBAY_SANDBOX_CLIENT_ID,
  EBAY_SANDBOX_CLIENT_SECRET: process.env.EBAY_SANDBOX_CLIENT_SECRET,
  EBAY_SANDBOX_RUNAME: process.env.EBAY_SANDBOX_RUNAME,
};

describe("eBay security helpers", () => {
  beforeAll(() => {
    process.env.APP_SESSION_SECRET = "test-secret-for-ebay-oauth-state";
    process.env.EBAY_SANDBOX_CLIENT_ID = "sandbox-client-id";
    process.env.EBAY_SANDBOX_CLIENT_SECRET = "sandbox-client-secret";
    process.env.EBAY_SANDBOX_RUNAME = "ApfelPark-Sandbox-RuName";
  });

  afterAll(() => {
    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it("encrypts tokens with authenticated encryption", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptEbayToken("secret-refresh-token", key);
    expect(encrypted).not.toContain("secret-refresh-token");
    expect(decryptEbayToken(encrypted, key)).toBe("secret-refresh-token");

    const tamperedParts = encrypted.split(".");
    const ciphertext = tamperedParts[3];
    tamperedParts[3] = `${ciphertext.startsWith("A") ? "B" : "A"}${ciphertext.slice(1)}`;
    expect(() => decryptEbayToken(tamperedParts.join("."), key)).toThrow();
  });

  it("signs, validates, and expires OAuth state", () => {
    const issuedAt = Date.UTC(2026, 7, 11, 10, 0, 0);
    const state = createEbayOAuthState("sandbox", "Info@Apfel-Park.de", issuedAt);
    expect(verifyEbayOAuthState(state, issuedAt + 60_000)).toMatchObject({
      actor: "info@apfel-park.de",
      environment: "sandbox",
    });
    expect(verifyEbayOAuthState(state, issuedAt + 11 * 60_000)).toBeNull();
    expect(verifyEbayOAuthState(`${state.slice(0, -1)}x`, issuedAt + 60_000)).toBeNull();
  });

  it("builds a least-privilege German consent request", () => {
    const url = new URL(buildEbayConsentUrl("sandbox", "info@apfel-park.de"));
    expect(url.origin).toBe("https://auth.sandbox.ebay.com");
    expect(url.searchParams.get("locale")).toBe("de-DE");
    expect(url.searchParams.get("redirect_uri")).toBe("ApfelPark-Sandbox-RuName");
    expect(url.searchParams.get("scope")).toContain("sell.inventory");
    expect(url.searchParams.get("scope")).not.toContain("sell.marketing");
    expect(url.toString()).not.toContain("sandbox-client-secret");
  });

  it("generates eBay's endpoint challenge response in the required order", () => {
    const challenge = "challenge-123";
    const token = "verification_token_1234567890abcdef";
    const endpoint = "https://apfel-park.de/api/webhooks/marketplaces/ebay_de";
    const expected = createHash("sha256").update(challenge).update(token).update(endpoint).digest("hex");
    expect(createEbayNotificationChallengeResponse(challenge, token, endpoint)).toBe(expected);
  });
});
