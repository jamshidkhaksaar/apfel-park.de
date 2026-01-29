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

import { createAdminClient } from "@/lib/supabase/admin";

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
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "recaptcha")
      .single();

    if (data?.value) {
      return {
        ...DEFAULT_SETTINGS,
        ...data.value,
      };
    }
  } catch (error) {
    console.error("Error fetching reCAPTCHA settings:", error);
  }

  return DEFAULT_SETTINGS;
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
  action?: string
): Promise<{ success: boolean; score?: number; error?: string }> => {
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

/**
 * Check if reCAPTCHA is enabled (for conditional rendering)
 */
export const isReCaptchaEnabled = async (): Promise<boolean> => {
  const settings = await getReCaptchaSettings();
  return settings.enabled && !!settings.siteKey;
};
