import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

import { isRepairBenchmarkPublished } from "@/lib/repair-price-benchmark";

describe("repair benchmark publication gate", () => {
  it.each([
    [undefined, false],
    ["true", true],
    ["false", false],
  ] as const)("reads the configured default %s", (value, expected) => {
    vi.stubEnv("REPAIR_PRICE_COMPARISON_VERIFIED", value);
    expect(isRepairBenchmarkPublished()).toBe(expected);
    expect(isRepairBenchmarkPublished("")).toBe(false);
  });

  it("fails closed unless verification is explicitly enabled", () => {
    vi.stubEnv("REPAIR_PRICE_COMPARISON_VERIFIED", undefined);
    expect(isRepairBenchmarkPublished(undefined)).toBe(false);
    expect(isRepairBenchmarkPublished("")).toBe(false);
    expect(isRepairBenchmarkPublished("false")).toBe(false);
    expect(isRepairBenchmarkPublished("true")).toBe(true);
  });
});
