import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { query } from "@/lib/db";
import { GET, POST } from "@/app/api/offer-subscribe/confirm/route";

vi.mock("@/lib/db", () => ({ query: vi.fn() }));

const token = "a".repeat(64);
const mockedQuery = vi.mocked(query);

describe("offer subscription confirmation", () => {
  beforeEach(() => mockedQuery.mockReset());

  it("renders a POST confirmation form on GET without consuming the token", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ locale: "de", confirmed_at: null, unsubscribed_at: null }] } as never);
    const response = await GET(new NextRequest(`https://apfel-park.de/api/offer-subscribe/confirm?token=${token}`));
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("content-disposition")).toBe("inline");
    expect(html).toContain('method="post"');
    expect(html).toContain("Anmeldung bestätigen");
    expect(String(mockedQuery.mock.calls[0][0])).toContain("SELECT locale");
    expect(String(mockedQuery.mock.calls[0][0])).not.toContain("UPDATE offer_subscribers");
  });

  it("shows success when a confirmed link is opened again", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ locale: "de", confirmed_at: "2026-08-29T17:19:15Z", unsubscribed_at: null }] } as never);
    const response = await GET(new NextRequest(`https://apfel-park.de/api/offer-subscribe/confirm?token=${token}`));
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("Anmeldung bestätigt");
    expect(html).not.toContain('method="post"');
  });

  it("confirms on POST without deleting the reusable token hash", async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ locale: "de" }] } as never);
    const request = new NextRequest("https://apfel-park.de/api/offer-subscribe/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
    const response = await POST(request);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("Anmeldung bestätigt");
    const sql = String(mockedQuery.mock.calls[0][0]);
    expect(sql).toContain("UPDATE offer_subscribers");
    expect(sql).not.toContain("confirmation_token_hash = NULL");
  });
});
