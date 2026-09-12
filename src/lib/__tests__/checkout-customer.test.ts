import { describe, expect, it } from "vitest";

import { normalizeCheckoutCustomer } from "../checkout";

describe("normalizeCheckoutCustomer", () => {
  it("requires a complete address for German delivery while keeping phone optional", () => {
    expect(() =>
      normalizeCheckoutCustomer(
        {
          name: "Customer",
          email: "customer@example.com",
          address: { line1: "", postalCode: "21109", city: "Hamburg", country: "DE" },
        },
        "germany",
        "de",
      ),
    ).toThrow("Lieferadresse");

    const resultWithoutPhone = normalizeCheckoutCustomer(
      {
        name: "Customer",
        email: "customer@example.com",
        address: { line1: "Teststraße 1", postalCode: "21109", city: "Hamburg", country: "DE" },
      },
      "germany",
      "de",
    );
    expect(resultWithoutPhone.phone).toBeNull();
  });

  it.each(["FR", "AT", "Deutschland", "DEF"])("rejects non-DE delivery country %s", (country) => {
    expect(() => normalizeCheckoutCustomer({
      name: "Customer", email: "customer@example.com",
      address: { line1: "Teststraße 1", postalCode: "21109", city: "Hamburg", country },
    }, "germany", "en")).toThrow("Germany");
  });

  it.each([" de ", "dE", undefined, "", "   "])("normalizes or defaults German country %s", (country) => {
    expect(normalizeCheckoutCustomer({
      name: "Customer", email: "customer@example.com",
      address: { line1: "Teststraße 1", postalCode: "01067", city: "Dresden", country },
    }, "germany", "de").address).toMatchObject({ country: "DE", postalCode: "01067" });
  });

  it.each(["1234", "123456", "21A09", "21 09", "DE-21109", "２１１０９", ""])("rejects malformed German postal code %s", (postalCode) => {
    expect(() => normalizeCheckoutCustomer({
      name: "Customer", email: "customer@example.com",
      address: { line1: "Teststraße 1", postalCode, city: "Hamburg", country: "DE" },
    }, "germany", "en")).toThrow("delivery address");
  });

  it("normalizes delivery contact data", () => {
    expect(
      normalizeCheckoutCustomer(
        {
          name: "  Customer  ",
          email: "  CUSTOMER@EXAMPLE.COM ",
          phone: " +49 170 1234567 ",
          address: {
            line1: " Teststraße 1 ",
            line2: " 2. OG ",
            postalCode: " 21109 ",
            city: " Hamburg ",
            country: " DE ",
          },
        },
        "germany",
        "de",
      ),
    ).toEqual({
      name: "Customer",
      email: "customer@example.com",
      phone: "+49 170 1234567",
      address: {
        line1: "Teststraße 1",
        line2: "2. OG",
        postalCode: "21109",
        city: "Hamburg",
        country: "DE",
      },
    });
  });

  it.each([
    { line1: "Unused" },
    { line1: "Unused", country: "FR", postalCode: "not-a-postcode" },
  ])("keeps phone optional and discards delivery address for pickup: %j", (address) => {
    expect(
      normalizeCheckoutCustomer(
        { name: "Customer", email: "customer@example.com", address },
        "pickup",
        "en",
      ),
    ).toMatchObject({ phone: null, address: null });
  });
});
