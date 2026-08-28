import { describe, expect, it } from "vitest";

import { normalizeMetadataTitle } from "../metadata";

describe("metadata title ownership", () => {
  it("lets the root template add the Apfel Park brand exactly once", () => {
    expect(normalizeMetadataTitle("Gerät verkaufen | Apfel Park")).toBe("Gerät verkaufen");
    expect(normalizeMetadataTitle("Kontakt & Anfahrt – Apfel Park Hamburg")).toBe("Kontakt & Anfahrt – Hamburg");
    expect(normalizeMetadataTitle("Online Shop")).toBe("Online Shop");
  });
});
