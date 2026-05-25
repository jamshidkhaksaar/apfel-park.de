import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { ADMIN_SESSION_COOKIE, createSessionToken, getSessionCookieOptions } from "@/lib/session";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { isSafeRedirect } from "@/lib/security";

const comparePasswords = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

export async function POST(request: NextRequest) {
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const token = String(formData.get("recaptchaToken") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");
  const buildRelativeRedirect = (target: string) => {
    const response = NextResponse.redirect("https://apfel-park.de/login", 303);
    response.headers.set("location", target);
    return response;
  };

  if (!email || !password) {
    return buildRelativeRedirect("/login?error=invalid");
  }

  const verification = await verifyReCaptcha(token, "admin_login");
  if (!verification.success) {
    return buildRelativeRedirect("/login?error=captcha");
  }

  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!adminEmails.has(email) || !expectedPassword || !comparePasswords(password, expectedPassword)) {
    return buildRelativeRedirect("/login?error=invalid");
  }

  const target = isSafeRedirect(redirectTo) ? redirectTo : "/admin";
  const response = buildRelativeRedirect(target);
  response.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(email), getSessionCookieOptions());
  return response;
}
