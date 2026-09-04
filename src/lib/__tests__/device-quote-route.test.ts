import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  consumePublicRateLimit: vi.fn(),
  verifyReCaptcha: vi.fn(),
  query: vi.fn(),
  sendContactNotificationEmail: vi.fn(),
  sendLeadTrackingEvents: vi.fn(),
}));

vi.mock("@/lib/public-rate-limit", () => ({
  consumePublicRateLimit: mocks.consumePublicRateLimit,
}));
vi.mock("@/lib/recaptcha", () => ({ verifyReCaptcha: mocks.verifyReCaptcha }));
vi.mock("@/lib/db", () => ({ query: mocks.query }));
vi.mock("@/lib/email", () => ({
  sendContactNotificationEmail: mocks.sendContactNotificationEmail,
}));
vi.mock("@/lib/marketing", () => ({
  sendLeadTrackingEvents: mocks.sendLeadTrackingEvents,
}));

import { POST } from "@/app/api/device-quotes/route";

const validPayload = {
  brand: "Xiaomi",
  model: "Redmi Note 15 Pro",
  condition: "open_box",
  storage: "256 GB",
  color: "Blue",
  budget: "400–500 EUR",
  fulfillment: "pickup",
  customerName: "Ada Example",
  email: "ada@example.com",
  phone: "",
  consent: true,
  locale: "de",
  recaptchaToken: "captcha-token",
};

const request = (payload: Record<string, unknown> = validPayload) => new NextRequest(
  "https://apfel-park.de/api/device-quotes",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-real-ip": "203.0.113.10",
      Cookie: "apfel-consent=external",
    },
    body: JSON.stringify(payload),
  },
);

describe("POST /api/device-quotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumePublicRateLimit.mockResolvedValue({ allowed: true, retryAfter: 900 });
    mocks.verifyReCaptcha.mockResolvedValue({ success: true, score: 0.9 });
    mocks.query.mockResolvedValue({ rows: [{ id: "quote-123" }] });
    mocks.sendContactNotificationEmail.mockResolvedValue({ success: true });
    mocks.sendLeadTrackingEvents.mockResolvedValue([]);
  });

  it("stores and emails a structured, non-binding sales lead without creating a product", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, id: "quote-123" });
    expect(mocks.consumePublicRateLimit).toHaveBeenCalledWith(expect.any(Headers), "device_quote", 5, 15 * 60);
    expect(mocks.verifyReCaptcha).toHaveBeenCalledWith("captcha-token", "device_quote");
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO device_quote_requests"),
      [
        "Ada Example",
        "ada@example.com",
        null,
        "de",
        "Xiaomi",
        "Redmi Note 15 Pro",
        "open_box",
        "256 GB",
        "Blue",
        "400–500 EUR",
        "pickup",
        true,
        0.9,
      ],
    );
    expect(mocks.sendContactNotificationEmail).toHaveBeenCalledWith(expect.objectContaining({
      name: "Ada Example",
      email: "ada@example.com",
      device: "Xiaomi Redmi Note 15 Pro",
      message: expect.stringMatching(/non-binding|unverbindlich/i),
    }));
    expect(mocks.sendLeadTrackingEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "Lead",
        formType: "contact",
        deviceModel: "Xiaomi Redmi Note 15 Pro",
      }),
      expect.objectContaining({ consentMode: "external" }),
    );
  });

  it("rejects oversized JSON bodies before consuming rate-limit or backend resources", async () => {
    const oversized = request({ ...validPayload, brand: "x".repeat(17_000) });
    oversized.headers.set("content-length", "17000");

    const response = await POST(oversized);

    expect(response.status).toBe(413);
    expect(mocks.consumePublicRateLimit).not.toHaveBeenCalled();
    expect(mocks.verifyReCaptcha).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("enforces the byte limit when Content-Length is missing", async () => {
    const oversized = request({ ...validPayload, brand: "x".repeat(17_000) });
    oversized.headers.delete("content-length");

    const response = await POST(oversized);

    expect(response.status).toBe(413);
    expect(mocks.consumePublicRateLimit).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("fails closed when the dedicated public rate limit is exhausted", async () => {
    mocks.consumePublicRateLimit.mockResolvedValue({ allowed: false, retryAfter: 321 });

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("321");
    expect(mocks.verifyReCaptcha).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("does not store or send a lead when CAPTCHA verification fails", async () => {
    mocks.verifyReCaptcha.mockResolvedValue({ success: false, error: "security_failed" });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.sendContactNotificationEmail).not.toHaveBeenCalled();
    expect(mocks.sendLeadTrackingEvents).not.toHaveBeenCalled();
  });

  it("accepts a phone-only lead without inventing an email address", async () => {
    const response = await POST(request({
      ...validPayload,
      email: "",
      phone: "+49 40 1234567",
    }));

    expect(response.status).toBe(200);
    expect(mocks.query.mock.calls[0]?.[1]?.slice(0, 3)).toEqual([
      "Ada Example",
      null,
      "+49 40 1234567",
    ]);
    expect(mocks.sendContactNotificationEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: "",
      message: expect.stringContaining("Phone: +49 40 1234567"),
    }));
  });
});
