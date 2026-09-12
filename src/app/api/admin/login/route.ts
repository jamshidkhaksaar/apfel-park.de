import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/login-rate-limit";
import { ADMIN_SESSION_COOKIE, createPersistedSessionToken, getSessionCookieOptions } from "@/lib/session";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { isSafeRedirect } from "@/lib/security";
import { verifyUserCredentials } from "@/lib/users";

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

  // Database credentials and current account state are authoritative. No env-password bypass.
  const dbResult = await verifyUserCredentials(email, password);
  if (!dbResult.valid) {
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
    await createPersistedSessionToken(email, dbResult.role, dbResult.securityVersion, dbResult.userId),
    getSessionCookieOptions(),
  );
  return response;
}
