/**
 * Google reCAPTCHA v3 utilities for form protection (SERVER-SIDE ONLY)
 * 
 * Forms that need protection:
 * - Contact form (/contact)
 * - Repair request form (/repairs) - when implemented
 * - Newsletter signup - when implemented
 * - Admin login (optional)
 * 
 * Development mode: Set NEXT_PUBLIC_RECAPTCHA_ENABLED=false to skip verification
 */

import { createAdminDbClient } from "@/lib/admin-db";
import { checkGuardToken, isGuardToken } from "@/lib/form-guard";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";

/**
 * Public enquiry forms opt in to the cookie-free guard (see form-guard.ts):
 * without consent they send a guard proof instead of a reCAPTCHA token.
 */
export type GuardOptions = {
  allowGuard: true;
  headers: Headers;
  /** Rate-limit bucket, e.g. "contact". */
  scope: string;
  /** Free text of the enquiry, checked for link spam. */
  text?: string;
};

/** Guard submissions per visitor and form per hour (reCAPTCHA ones keep the route limit). */
const GUARD_MAX_PER_HOUR = 3;

const verifyGuard = async (token: string, options: GuardOptions): Promise<{ success: boolean; score?: number; error?: string }> => {
  const check = checkGuardToken(token, options.text ?? "");
  if (!check.ok) {
    console.warn(`[form-guard] ${options.scope} rejected: ${check.reason}`);
    return { success: false, error: "Security verification failed" };
  }
  const limit = await consumePublicRateLimit(options.headers, `${options.scope}_guard`, GUARD_MAX_PER_HOUR, 60 * 60);
  if (!limit.allowed) {
    console.warn(`[form-guard] ${options.scope} rate limited`);
    return { success: false, error: "Too many requests" };
  }
  console.log(`[form-guard] ${options.scope} accepted without reCAPTCHA (no consent)`);
  return { success: true };
};

// Types
export type ReCaptchaSettings = {
  enabled: boolean;
  siteKey: string;
  secretKey: string;
  minScore: number; // 0.0 to 1.0, default 0.5
};

export type ReCaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

/**
 * Default settings when reCAPTCHA is not configured
 */
const DEFAULT_SETTINGS: ReCaptchaSettings = {
  enabled: false,
  siteKey: "",
  secretKey: "",
  minScore: 0.5,
};

/**
 * Get reCAPTCHA settings from database (server-side)
 * Uses Service Role key to access secure settings
 */
export const getReCaptchaSettings = async (): Promise<ReCaptchaSettings> => {
  try {
    const adminDb = createAdminDbClient();

    const { data, error } = await adminDb
      .from("store_settings")
      .select("value")
      .eq("key", "recaptcha")
      .maybeSingle();

    if (error) throw error;

    const storedValue = data?.value as Partial<ReCaptchaSettings> | null | undefined;
    if (storedValue) {
      return {
        ...DEFAULT_SETTINGS,
        ...storedValue,
      };
    }
  } catch (error) {
    console.error("Error fetching reCAPTCHA settings:", error);
  }

  return process.env.NODE_ENV === "production"
    ? { ...DEFAULT_SETTINGS, enabled: true }
    : DEFAULT_SETTINGS;
};

/**
 * Verify reCAPTCHA token server-side
 * 
 * @param token - The reCAPTCHA token from the client
 * @param action - Expected action name (e.g., "contact_form", "repair_request")
 * @returns Object with success status and optional error message
 */
export const verifyReCaptcha = async (
  token: string,
  action?: string,
  guard?: GuardOptions,
): Promise<{ success: boolean; score?: number; error?: string }> => {
  if (isGuardToken(token)) {
    if (!guard?.allowGuard) return { success: false, error: "Security verification failed" };
    return verifyGuard(token, guard);
  }

  const settings = await getReCaptchaSettings();

  // Skip verification if reCAPTCHA is disabled
  if (!settings.enabled) {
    console.log("[reCAPTCHA] Verification skipped - disabled in settings");
    return { success: true, score: 1.0 };
  }

  // Check if secret key is configured
  if (!settings.secretKey) {
    console.error("[reCAPTCHA] Secret key not configured");
    return { success: false, error: "reCAPTCHA not configured" };
  }

  // Check if token is provided
  if (!token) {
    return { success: false, error: "No reCAPTCHA token provided" };
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: settings.secretKey,
        response: token,
      }),
    });

    const result: ReCaptchaVerifyResponse = await response.json();

    if (!result.success) {
      console.error("[reCAPTCHA] Verification failed:", result["error-codes"]);
      return {
        success: false,
        error: `Verification failed: ${result["error-codes"]?.join(", ") || "Unknown error"}`,
      };
    }

    // Check score threshold (reCAPTCHA v3)
    if (result.score !== undefined && result.score < settings.minScore) {
      console.warn(`[reCAPTCHA] Score too low: ${result.score} < ${settings.minScore}`);
      return {
        success: false,
        score: result.score,
        error: "Suspicious activity detected",
      };
    }

    // Verify action matches (optional but recommended)
    if (action && result.action && result.action !== action) {
      console.warn(`[reCAPTCHA] Action mismatch: expected ${action}, got ${result.action}`);
      return {
        success: false,
        error: "Action mismatch",
      };
    }

    console.log(`[reCAPTCHA] Verified successfully. Score: ${result.score}`);
    return { success: true, score: result.score };
  } catch (error) {
    console.error("[reCAPTCHA] Verification error:", error);
    return { success: false, error: "Verification request failed" };
  }
};
