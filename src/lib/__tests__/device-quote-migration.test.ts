import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260904_device_quote_requests.sql",
);

describe("device quote request migration", () => {
  it("stores a consented lead lifecycle without creating catalog inventory or commerce claims", async () => {
    const sql = (await readFile(migrationPath, "utf8")).toLowerCase();

    expect(sql).toContain("create table if not exists public.device_quote_requests");
    expect(sql).toContain("email text");
    expect(sql).toContain("phone text");
    expect(sql).toMatch(/check\s*\(\s*email is not null or phone is not null\s*\)/);
    expect(sql).toContain("consent boolean not null check (consent = true)");
    expect(sql).toContain("'new','quoted','accepted','declined','converted','closed'");
    expect(sql).toContain("alter table public.device_quote_requests enable row level security");
    expect(sql).not.toContain("auth.role() = 'authenticated'");
    expect(sql).not.toContain("create policy");
    expect(sql).not.toContain("product_id");
    expect(sql).not.toContain("merchant");
    expect(sql).not.toContain("stock");
    expect(sql).not.toContain("sale_count");
  });
});
