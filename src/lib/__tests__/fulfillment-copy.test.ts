import { describe, expect, it } from "vitest";

import { fulfillmentCopy } from "../fulfillment-copy";

describe("fulfillment copy", () => {
  it("explains online payment and distinguishes pickup from delivery in German", () => {
    expect(fulfillmentCopy.de.notice).toContain("bezahlst du online");
    expect(fulfillmentCopy.de.pickup.title).toBe("Online bestellen & im Store abholen");
    expect(fulfillmentCopy.de.delivery.title).toBe("Online bestellen & nach Hause liefern lassen");
  });

  it("keeps the fulfillment values stable for checkout", () => {
    expect(fulfillmentCopy.pickupValue).toBe("pickup");
    expect(fulfillmentCopy.deliveryValue).toBe("germany");
  });
});
