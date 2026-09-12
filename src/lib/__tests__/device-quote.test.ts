import { describe, expect, it } from "vitest";

import { parseDeviceQuoteRequest } from "@/lib/device-quote";
import { buildEmailContent } from "@/lib/email";

describe("parseDeviceQuoteRequest", () => {
  it("accepts and sanitizes a non-binding device request with an email contact route", () => {
    expect(parseDeviceQuoteRequest({
      brand: "  Xiaomi  ",
      model: "  Redmi Note 15 Pro  ",
      condition: "open_box",
      storage: " 256 GB ",
      color: " Blue ",
      budget: " 400–500 EUR ",
      fulfillment: "pickup",
      customerName: " Ada Example ",
      email: " ada@example.com ",
      phone: "",
      consent: true,
      locale: "de",
      recaptchaToken: "token",
    })).toEqual({
      success: true,
      data: {
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
        recaptchaToken: "token",
      },
    });
  });

  it("accepts a phone-only contact route and normalizes its whitespace", () => {
    const result = parseDeviceQuoteRequest({
      brand: "Samsung",
      model: "Galaxy S26 Ultra",
      condition: "new",
      storage: "",
      color: "",
      budget: "",
      fulfillment: "shipping",
      customerName: "Grace Example",
      email: "",
      phone: " +49 (0)40   123 45 67 ",
      consent: true,
      locale: "en",
      recaptchaToken: "token",
    });

    expect(result).toMatchObject({
      success: true,
      data: { phone: "+49 (0)40 123 45 67", email: "" },
    });
  });

  it("rejects a request without a valid email or phone contact route", () => {
    expect(parseDeviceQuoteRequest({
      brand: "Apple",
      model: "iPhone 17",
      condition: "used",
      fulfillment: "pickup",
      customerName: "No Contact",
      email: "invalid",
      phone: "123",
      consent: true,
      locale: "de",
      recaptchaToken: "token",
    })).toEqual({ success: false, error: "invalid_contact" });
  });

  it("rejects an invalid supplied email instead of using it as Reply-To when the phone is valid", () => {
    expect(parseDeviceQuoteRequest({
      brand: "Samsung",
      model: "Galaxy S26 Ultra",
      condition: "new",
      fulfillment: "shipping",
      customerName: "Phone Buyer",
      email: "not-an-email",
      phone: "+49 40 1234567",
      consent: true,
      locale: "en",
      recaptchaToken: "token",
    })).toEqual({ success: false, error: "invalid_contact" });
  });

  it("requires brand, model, customer name, condition, fulfillment, and explicit consent", () => {
    expect(parseDeviceQuoteRequest({
      brand: "",
      model: "",
      condition: "refurbished",
      fulfillment: "courier",
      customerName: "",
      email: "buyer@example.com",
      phone: "",
      consent: false,
      locale: "de",
      recaptchaToken: "token",
    })).toEqual({ success: false, error: "invalid_fields" });
  });

  it("rejects oversized input before it reaches storage or email", () => {
    expect(parseDeviceQuoteRequest({
      brand: "x".repeat(121),
      model: "Phone",
      condition: "new",
      fulfillment: "shipping",
      customerName: "Buyer",
      email: "buyer@example.com",
      phone: "",
      consent: true,
      locale: "en",
      recaptchaToken: "token",
    })).toEqual({ success: false, error: "too_long" });
  });
});

describe("contact notification content", () => {
  it("shows a clear placeholder instead of inventing an email for phone-only leads", () => {
    const content = buildEmailContent({
      name: "Phone Buyer",
      email: "",
      device: "Samsung Galaxy S26 Ultra",
      message: "Phone: +49 40 1234567",
      locale: "en",
    });

    expect(content.text).toContain("Email: -");
    expect(content.html).toContain("<strong>Email:</strong> -");
  });
});
