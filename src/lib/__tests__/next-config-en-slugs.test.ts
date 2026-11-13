import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

const redirects = async () => (await nextConfig.redirects?.()) ?? [];
const rewrites = async () => {
  const value = await nextConfig.rewrites?.();
  return Array.isArray(value) ? value : [];
};

const expectedSlugs = [
  ["samsung-handys", "samsung-phones"],
  ["xiaomi-redmi-handys", "xiaomi-redmi-phones"],
  ["handys-ohne-vertrag", "unlocked-phones"],
  ["gebrauchte-handys", "used-phones"],
  ["gebrauchte-iphones", "used-iphones"],
  ["firmenkunden", "business"],
] as const;

describe("/en/ collection slug migration", () => {
  it("permanently redirects every old German /en/ slug", async () => {
    const rules = await redirects();
    for (const [german, english] of expectedSlugs) {
      const rule = rules.find((entry) => entry.source === `/en/${german}`);
      expect(rule, german).toBeDefined();
      expect(rule?.destination).toBe(`/en/${english}`);
      expect(rule?.permanent ?? rule?.statusCode === 301).toBe(true);
    }
  });

  it("leaves the German collection routes on their own slugs", async () => {
    const rules = await redirects();
    for (const [german] of expectedSlugs) {
      expect(rules.some((entry) => entry.source === `/de/${german}`), german).toBe(false);
    }
  });

  it("serves each English slug from the existing localized page", async () => {
    const rules = await rewrites();
    for (const [german, english] of expectedSlugs) {
      const rule = rules.find((entry) => entry.source === `/en/${english}`);
      expect(rule, english).toBeDefined();
      expect(rule?.destination).toBe(`/en/${german}`);
    }
  });
});
