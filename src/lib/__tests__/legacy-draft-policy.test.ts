import { describe, expect, it } from "vitest";

import { resolveLegacyDraftPolicy } from "@/lib/legacy-draft-policy";

describe("legacy product draft policy", () => {
  it("never permits direct publication", () => {
    expect(resolveLegacyDraftPolicy({ updateExisting: false, existingIsActive: null }).isActive).toBe(false);
  });

  it("rejects mutation of an existing live product", () => {
    expect(resolveLegacyDraftPolicy({ updateExisting: true, existingIsActive: true }).allowWrite).toBe(false);
    expect(resolveLegacyDraftPolicy({ updateExisting: true, existingIsActive: false }).allowWrite).toBe(true);
  });
});
