import { describe, expect, it } from "vitest";

import { toIsoTimestamp } from "../database-timestamp";

describe("database timestamp serialization", () => {
  it("serializes pg Date values without locale-dependent text", () => {
    expect(toIsoTimestamp(new Date("2026-08-31T10:46:03.123Z"))).toBe(
      "2026-08-31T10:46:03.123Z",
    );
  });

  it("normalizes timestamp strings and rejects invalid values", () => {
    expect(toIsoTimestamp("2026-08-31 10:46:03+00")).toBe("2026-08-31T10:46:03.000Z");
    expect(toIsoTimestamp("not-a-timestamp")).toBeNull();
    expect(toIsoTimestamp(null)).toBeNull();
  });
});
