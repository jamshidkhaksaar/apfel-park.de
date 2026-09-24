import { describe, expect, it } from "vitest";

import { buildPaidOrderAdminEmail, buildUnpaidOrderCustomerEmail } from "../email";

describe("buildPaidOrderAdminEmail", () => {
  it("includes fulfillment details and escapes customer-controlled HTML", () => {
    const result = buildPaidOrderAdminEmail({
      id: "12345678-1234-1234-1234-123456789012",
      orderNumber: 19,
      paidAt: "2026-08-16T08:10:04.000Z",
      provider: "stripe",
      customerName: "<script>alert(1)</script>",
      customerEmail: "customer@example.com",
      customerPhone: null,
      shippingMethod: "germany",
      customerAddress: {
        line1: "Teststraße 1",
        postalCode: "21109",
        city: "Hamburg",
        country: "DE",
      },
      items: [{ title: "iPhone 15 Pro Max", sku: "IP15", quantity: 1, lineAmount: 879 }],
      subtotalAmount: 879,
      shippingAmount: 6.9,
      totalAmount: 885.9,
      currency: "EUR",
      adminUrl: "https://apfel-park.de/admin/orders/12345678-1234-1234-1234-123456789012",
    });

    expect(result.subject).toBe("Neue bezahlte Bestellung #A-19");
    expect(result.text).toContain("Telefon: Nicht angegeben");
    expect(result.text).toContain("Teststraße 1");
    expect(result.text).toContain("iPhone 15 Pro Max");
    expect(result.html).not.toContain("<script>alert(1)</script>");
    expect(result.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("buildUnpaidOrderCustomerEmail", () => {
  it("includes the order and logo while escaping customer content", () => {
    const result = buildUnpaidOrderCustomerEmail({
      orderId: "12345678-1234-1234-1234-123456789012",
      orderNumber: 45,
      customerName: "<script>alert(1)</script>",
      customerEmail: "customer@example.com",
      locale: "en",
      items: [{ title: "<img src=x>", quantity: 1, lineAmount: 99 }],
      totalAmount: 99,
      currency: "EUR",
    });
    expect(result.subject).toContain("#A-45");
    expect(result.html).toContain("/branding/apfel-park-white.png");
    expect(result.html).not.toContain("<script>alert(1)</script>");
    expect(result.html).toContain("&lt;img src=x&gt;");
    expect(result.text).toContain("please do not pay again");
  });
});
