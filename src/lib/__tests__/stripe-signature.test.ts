import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyStripeSignature } from "../checkout";

const secret = "whsec_test";
const payload = '{"id":"evt_1"}';
const signature = (timestamp: number) => createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");

describe("Stripe webhook signature verification", () => {
  it("accepts any matching v1 signature within five minutes", () => {
    const now = 1_800_000_000;
    expect(verifyStripeSignature(payload, `t=${now - 60},v1=bad,v1=${signature(now - 60)}`, secret, now)).toBe(true);
  });

  it("rejects old, future, and malformed timestamps", () => {
    const now = 1_800_000_000;
    expect(verifyStripeSignature(payload, `t=${now - 301},v1=${signature(now - 301)}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${now + 301},v1=${signature(now + 301)}`, secret, now)).toBe(false);
    expect(verifyStripeSignature(payload, `t=nope,v1=abc`, secret, now)).toBe(false);
  });
});
