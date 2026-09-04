import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../ReCaptcha", () => ({
  useReCaptcha: () => ({
    execute: async () => "captcha-token",
    isLoading: false,
    error: null,
    ReCaptchaComponent: () => null,
  }),
}));

import { DeviceQuoteFormContent, submitDeviceQuote } from "../DeviceQuoteForm";

describe("DeviceQuoteForm", () => {
  it("places the smartphone quote CTA before the catalog grid", () => {
    const source = readFileSync('src/app/(site)/[lang]/smartphones/page.tsx', 'utf8');
    expect(source).toContain('<DeviceQuoteForm locale={lang}');
    expect(source.indexOf('<DeviceQuoteForm')).toBeLessThan(source.indexOf('<StoreGrid'));
  });
  it("renders a labelled header button without the catalog teaser", () => {
    const html = renderToStaticMarkup(createElement(DeviceQuoteFormContent, { locale: "de", variant: "header" }));
    expect(html).toContain('Preis anfragen');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain('<section');
    expect(html).not.toContain('Derzeit nicht auf Lager');
  });
  it("keeps multiple quote dialogs and their accessible references unique", () => {
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(DeviceQuoteFormContent, { locale: "en" }),
      createElement(DeviceQuoteFormContent, { locale: "en" }),
    ));
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const match of html.matchAll(/aria-(?:controls|labelledby|describedby)="([^"]+)"/g)) {
      expect(ids).toContain(match[1]);
    }
  });
  it("keeps the form in a closed labelled native dialog behind a compact CTA", () => {
    const html = renderToStaticMarkup(createElement(DeviceQuoteFormContent, { locale: "en" }));
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toMatch(/aria-controls="device-quote-dialog-[^"]+"/);
    expect(html).toMatch(/<dialog[^>]*aria-labelledby="device-quote-dialog-heading-[^"]+"/);
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/);
    expect(html).toMatch(/id="device-quote-heading-[^"]+"/);
    expect(html).toContain('Close');
  });
  it("groups optional preferences and keeps contact labels visible", () => {
    const html = renderToStaticMarkup(createElement(DeviceQuoteFormContent, { locale: "en" }));
    expect(html).toContain('<summary');
    expect(html).toContain('Preferences (optional)');
    expect(html).not.toContain('class="sr-only">Email');
    expect(html).not.toContain('class="sr-only">Phone');
  });
  it("renders the complete German request-only form without commerce claims", () => {
    const html = renderToStaticMarkup(createElement(DeviceQuoteFormContent, { locale: "de" }));

    expect(html).toContain("Preis anfragen");
    expect(html).toContain("Derzeit nicht auf Lager");
    expect(html).toContain("unverbindlich");
    expect(html).toContain("Marke");
    expect(html).toContain("Modell");
    expect(html).toContain("Neu");
    expect(html).toContain("Open Box");
    expect(html).toContain("Gebraucht");
    expect(html).toContain("Speicher");
    expect(html).toContain("Farbe");
    expect(html).toContain("Bevorzugte Preisspanne");
    expect(html).toContain("Abholung");
    expect(html).toContain("Versand");
    expect(html).toContain("E-Mail oder Telefonnummer");
    expect(html).toContain("Datenschutzerklärung");
    expect(html).not.toContain("Kaufen");
    expect(html).not.toContain('application/ld+json');
    expect(html).not.toContain('itemtype="https://schema.org/Product"');
    expect(html).not.toContain("Verkäufe");
  });

  it("renders equivalent request-only guidance and fields in English", () => {
    const html = renderToStaticMarkup(createElement(DeviceQuoteFormContent, { locale: "en" }));

    expect(html).toContain("Request a quote");
    expect(html).toContain("Currently not in stock");
    expect(html).toContain("non-binding");
    expect(html).toContain("Brand");
    expect(html).toContain("Model");
    expect(html).toContain("Preferred price range");
    expect(html).toContain("Pickup");
    expect(html).toContain("Shipping");
    expect(html).toContain("Email or phone number");
    expect(html).toContain("Privacy Policy");
    expect(html).not.toContain("Buy");
    expect(html).not.toContain('application/ld+json');
    expect(html).not.toContain('itemtype="https://schema.org/Product"');
    expect(html).not.toContain("sales");
  });

  it("submits a fresh CAPTCHA token and emits the established analytics event without price data", async () => {
    const form = new FormData();
    Object.entries({
      brand: "Xiaomi",
      model: "Poco X8 Pro",
      condition: "new",
      storage: "256 GB",
      color: "Black",
      budget: "up to 500 EUR",
      fulfillment: "shipping",
      customerName: "Test Buyer",
      email: "buyer@example.com",
      phone: "",
      consent: "on",
    }).forEach(([key, value]) => form.set(key, value));
    const executeRecaptcha = vi.fn().mockResolvedValue("fresh-token");
    const fetcher = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true, id: "quote-1" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ));
    const track = vi.fn();

    await expect(submitDeviceQuote(form, "en", { executeRecaptcha, fetcher, track })).resolves.toEqual({
      success: true,
      id: "quote-1",
    });
    expect(executeRecaptcha).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith("/api/device-quotes", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.stringContaining('"recaptchaToken":"fresh-token"'),
    }));
    expect(track).toHaveBeenCalledWith("device_quote_request", {
      brand: "Xiaomi",
      condition: "new",
      fulfillment: "shipping",
      locale: "en",
    });
    expect(track.mock.calls[0]?.[1]).not.toHaveProperty("budget");
    expect(track.mock.calls[0]?.[1]).not.toHaveProperty("price");
  });
});
