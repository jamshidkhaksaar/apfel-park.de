import { describe, expect, it } from "vitest";

import { validatePayPalWebhookEnvelope } from "@/lib/paypal-webhook-envelope";

const validHeaders = () => new Headers({
  "paypal-auth-algo": "SHA256withRSA",
  "paypal-cert-url": "https://api.paypal.com/v1/notifications/certs/CERT-1",
  "paypal-transmission-id": "transmission-1",
  "paypal-transmission-sig": "signature",
  "paypal-transmission-time": "2026-08-29T00:00:00Z",
});

describe("PayPal webhook envelope", () => {
  it("accepts bounded, well-shaped PayPal envelopes", () => {
    expect(validatePayPalWebhookEnvelope({
      headers: validHeaders(),
      bodyBytes: 500,
      eventId: "WH-123",
      eventType: "PAYMENT.CAPTURE.COMPLETED",
    })).toBe(true);
  });

  it("rejects missing headers, oversized bodies, and untrusted cert hosts", () => {
    expect(validatePayPalWebhookEnvelope({ headers: new Headers(), bodyBytes: 500, eventId: "WH-1", eventType: "PAYMENT.CAPTURE.COMPLETED" })).toBe(false);
    expect(validatePayPalWebhookEnvelope({ headers: validHeaders(), bodyBytes: 2 * 1024 * 1024, eventId: "WH-1", eventType: "PAYMENT.CAPTURE.COMPLETED" })).toBe(false);
    const headers = validHeaders();
    headers.set("paypal-cert-url", "https://attacker.example/cert");
    expect(validatePayPalWebhookEnvelope({ headers, bodyBytes: 500, eventId: "WH-1", eventType: "PAYMENT.CAPTURE.COMPLETED" })).toBe(false);
  });
});
