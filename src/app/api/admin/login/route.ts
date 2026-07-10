import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/login-rate-limit";
import { ADMIN_SESSION_COOKIE, createSessionToken, getSessionCookieOptions } from "@/lib/session";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { isSafeRedirect } from "@/lib/security";
import { verifyUserCredentials } from "@/lib/users";

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

  // Site is fronted by Cloudflare: CF-Connecting-IP carries the real client IP,
  // while X-Real-IP holds the rotating Cloudflare edge address.
  const clientIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ipKey = `ip:${clientIp}`;
  const emailKey = `email:${email}`;

  if (isLoginBlocked(ipKey) || isLoginBlocked(emailKey)) {
    return buildRelativeRedirect("/login?error=rate");
  }

  const verification = await verifyReCaptcha(token, "admin_login");
  if (!verification.success) {
    // If reCAPTCHA is enabled but the token is empty (script blocked by ad blocker,
    // consent issue, etc.), fall back to rate limiting instead of hard-blocking.
    // Rate limiting (above) still prevents brute-force attacks.
    if (token) {
      recordLoginFailure(ipKey);
      return buildRelativeRedirect("/login?error=captcha");
    }
    // Empty token: log a warning but proceed — rate limiting is the safety net.
    console.warn("[Login] reCAPTCHA verification failed with empty token — relying on rate limiting");
  }

  let sessionRole: string | undefined;

  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (adminEmails.has(email) && expectedPassword && comparePasswords(password, expectedPassword)) {
    sessionRole = "admin";
  } else {
    const dbResult = await verifyUserCredentials(email, password);
    if (dbResult.valid) {
      sessionRole = dbResult.role;
    }
  }

  if (!sessionRole) {
    recordLoginFailure(ipKey);
    recordLoginFailure(emailKey);
    return buildRelativeRedirect("/login?error=invalid");
  }

  clearLoginFailures(ipKey);
  clearLoginFailures(emailKey);

  const target = isSafeRedirect(redirectTo) ? redirectTo : "/admin";
  const response = buildRelativeRedirect(target);
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    createSessionToken(email, sessionRole),
    getSessionCookieOptions(),
  );
  return response;
}
