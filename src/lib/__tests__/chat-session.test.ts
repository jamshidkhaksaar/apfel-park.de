import { describe, expect, it } from "vitest";

import { CHAT_SESSION_COOKIE, getChatSessionCookieOptions } from "@/lib/chat-session";

describe("chat session cookie", () => {
  it("is HttpOnly, SameSite, bounded, and secure in production", () => {
    expect(CHAT_SESSION_COOKIE).not.toContain("token");
    expect(getChatSessionCookieOptions("production")).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    expect(getChatSessionCookieOptions("production").maxAge).toBeLessThanOrEqual(31 * 24 * 60 * 60);
    expect(getChatSessionCookieOptions("test").secure).toBe(false);
  });
});
