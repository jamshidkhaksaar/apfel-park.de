import { describe, expect, it } from "vitest";

import { isRepairBenchmarkPublished } from "@/lib/repair-price-benchmark";

describe("repair benchmark publication gate", () => {
  it("fails closed unless verification is explicitly enabled", () => {
    expect(isRepairBenchmarkPublished(undefined)).toBe(false);
    expect(isRepairBenchmarkPublished("")).toBe(false);
    expect(isRepairBenchmarkPublished("false")).toBe(false);
    expect(isRepairBenchmarkPublished("true")).toBe(true);
  });
});
