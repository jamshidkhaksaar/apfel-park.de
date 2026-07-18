"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { CONSENT_EVENT_NAME, readConsentMode, type ConsentMode } from "@/lib/consent";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    onReCaptchaLoad?: () => void;
  }
}

type ReCaptchaProps = {
  action: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onLoad?: () => void;
  requireConsent?: boolean;
  executeRef?: { current: (() => Promise<string>) | null };
};

const getConsentErrorMessage = () => {
  if (typeof document !== "undefined" && document.documentElement.lang.startsWith("de")) {
    return "Externer Google-Spamschutz ist erst nach Ihrer Zustimmung verfügbar.";
  }

  return "External Google spam protection is disabled until consent is granted.";
};

/**
 * Get reCAPTCHA site key from database (client-side)
 */
const getReCaptchaSiteKey = async (): Promise<{ siteKey: string; enabled: boolean }> => {
  try {
    const response = await fetch("/api/public/recaptcha", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      return {
        siteKey: data.siteKey || "",
        enabled: Boolean(data.enabled),
      };
    }
  } catch (error) {
    console.error("Error fetching reCAPTCHA site key:", error);
  }

  return { siteKey: "", enabled: false };
};

/**
 * Google reCAPTCHA v3 component
 * 
 * Usage:
 * ```tsx
 * const [captchaToken, setCaptchaToken] = useState("");
 * 
 * <ReCaptcha 
 *   action="contact_form" 
 *   onVerify={setCaptchaToken} 
 * />
 * ```
 * 
 * The token should be sent with your form submission and verified server-side.
 */
export default function ReCaptcha({ action, onVerify, onError, onLoad, requireConsent = true, executeRef }: ReCaptchaProps) {
  const [siteKey, setSiteKey] = useState<string>("");
  const [enabled, setEnabled] = useState<boolean>(false);
  const [consentMode, setConsentMode] = useState<ConsentMode>(() => readConsentMode());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const executedRef = useRef(false);

  const consentBlocked = Boolean(enabled && siteKey && requireConsent && consentMode !== "external");
  const consentMessage = consentBlocked ? getConsentErrorMessage() : null;

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getReCaptchaSiteKey();
        setSiteKey(settings.siteKey);
        setEnabled(settings.enabled);
        
        // If disabled, immediately call onVerify with empty token
        // Server will skip verification when disabled
        if (!settings.enabled) {
          onVerify("");
          onLoad?.();
        }
      } catch (err) {
        console.error("Failed to load reCAPTCHA settings:", err);
        setError("Failed to load reCAPTCHA");
        onError?.("Failed to load reCAPTCHA settings");
      }
    };

    loadSettings();
  }, [onVerify, onError, onLoad]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      setConsentMode((event as CustomEvent<ConsentMode>).detail ?? readConsentMode());
      setLoaded(false);
      executedRef.current = false;
    };

    window.addEventListener(CONSENT_EVENT_NAME, handleChange as EventListener);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, handleChange as EventListener);
    };
  }, []);

  // Notify the parent while consent is missing
  useEffect(() => {
    if (consentMessage) {
      onError?.(consentMessage);
    }
  }, [consentMessage, onError]);

  // Load reCAPTCHA script
  useEffect(() => {
    if (!enabled || !siteKey || loaded || consentBlocked) return;

    // Check if script already exists
    if (document.querySelector(`script[src*="recaptcha"]`)) {
      const timeoutId = window.setTimeout(() => {
        setLoaded(true);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setLoaded(true);
      onLoad?.();
    };

    script.onerror = () => {
      setError("Failed to load reCAPTCHA");
      onError?.("Failed to load reCAPTCHA script");
    };

    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      // Cleanup on unmount (optional - usually want to keep script loaded)
    };
  }, [consentBlocked, enabled, siteKey, loaded, onError, onLoad]);

  // Request a fresh token from Google. reCAPTCHA v3 tokens expire after
  // 2 minutes, so callers should execute as close to form submission as possible.
  const requestFreshToken = useCallback(async (): Promise<string> => {
    if (!enabled || !siteKey) return "";
    if (requireConsent && consentMode !== "external") return "";

    await new Promise<void>((resolve) => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(resolve);
      } else {
        // Wait for grecaptcha to be available
        const checkInterval = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(checkInterval);
            window.grecaptcha.ready(resolve);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 10000);
      }
    });

    if (!window.grecaptcha) {
      throw new Error("reCAPTCHA not available");
    }

    const token = await window.grecaptcha.execute(siteKey, { action });
    onVerify(token);
    return token;
  }, [enabled, siteKey, consentMode, action, onVerify, requireConsent]);

  // Execute reCAPTCHA once when ready (prefetch for forms that don't
  // execute at submit time)
  const executeReCaptcha = useCallback(async () => {
    if (executedRef.current) return;

    try {
      await requestFreshToken();
      executedRef.current = true;
    } catch (err) {
      console.error("reCAPTCHA execution error:", err);
      setError("reCAPTCHA verification failed");
      onError?.("reCAPTCHA execution failed");
    }
  }, [requestFreshToken, onError]);

  // Expose an on-demand executor so forms can get a fresh token at submit time
  useEffect(() => {
    if (!executeRef) return;

    executeRef.current = async () => {
      try {
        return await requestFreshToken();
      } catch (err) {
        console.error("reCAPTCHA execution error:", err);
        return "";
      }
    };

    return () => {
      executeRef.current = null;
    };
  }, [executeRef, requestFreshToken]);

  // Execute when loaded
  useEffect(() => {
    if (loaded && enabled && siteKey && (!requireConsent || consentMode === "external")) {
      const timeoutId = window.setTimeout(() => {
        void executeReCaptcha();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [loaded, enabled, siteKey, consentMode, executeReCaptcha, requireConsent]);

  // Don't render anything visible for reCAPTCHA v3
  // The badge is shown by Google automatically (can be hidden with CSS if disclosed in privacy policy)
  const displayError = error ?? consentMessage;

  if (displayError) {
    return (
      <div className="text-xs text-red-400">
        {displayError}
      </div>
    );
  }

  if (!enabled) {
    return null;
  }

  return null;
}

/**
 * Hook for using reCAPTCHA in forms
 */
export function useReCaptcha(action: string, options?: { requireConsent?: boolean }) {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const executeRef = useRef<(() => Promise<string>) | null>(null);
  const tokenRef = useRef<string>("");

  const handleVerify = useCallback((newToken: string) => {
    tokenRef.current = newToken;
    setToken(newToken);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    // Script loaded, waiting for token
  }, []);

  const requireConsent = options?.requireConsent ?? true;

  /**
   * Execute reCAPTCHA on demand and return a fresh token.
   * Prefer this at form submit time: v3 tokens expire after 2 minutes,
   * so the prefetched `token` may already be stale. Falls back to the
   * last known token (or "") if execution fails or Google is unreachable.
   */
  const execute = useCallback(async (): Promise<string> => {
    if (!executeRef.current) {
      return tokenRef.current;
    }

    try {
      return await Promise.race([
        executeRef.current(),
        new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error("reCAPTCHA execute timed out")), 8000);
        }),
      ]);
    } catch {
      return tokenRef.current;
    }
  }, []);

  const ReCaptchaComponent = useCallback(() => (
    <ReCaptcha
      action={action}
      onVerify={handleVerify}
      onError={handleError}
      onLoad={handleLoad}
      requireConsent={requireConsent}
      executeRef={executeRef}
    />
  ), [action, handleVerify, handleError, handleLoad, requireConsent]);

  return {
    token,
    isLoading,
    error,
    execute,
    ReCaptchaComponent,
  };
}
