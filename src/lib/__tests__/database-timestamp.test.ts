import { describe, expect, it } from "vitest";

import { toDatabaseTimestampToken, toIsoTimestamp } from "../database-timestamp";

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

  it("preserves PostgreSQL microseconds for optimistic concurrency tokens", () => {
    expect(toDatabaseTimestampToken("2026-09-04 14:25:57.597395+00")).toBe(
      "2026-09-04 14:25:57.597395+00",
    );
    expect(toDatabaseTimestampToken(new Date("2026-09-04T14:25:57.597Z"))).toBe(
      "2026-09-04T14:25:57.597Z",
    );
    expect(toDatabaseTimestampToken("not-a-timestamp")).toBeNull();
  });
});
