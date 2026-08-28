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

  it("keeps phone optional and discards delivery address for pickup", () => {
    expect(
      normalizeCheckoutCustomer(
        { name: "Customer", email: "customer@example.com", address: { line1: "Unused" } },
        "pickup",
        "en",
      ),
    ).toMatchObject({ phone: null, address: null });
  });
});
