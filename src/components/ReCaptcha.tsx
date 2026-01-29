"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
};

/**
 * Get reCAPTCHA site key from database (client-side)
 */
const getReCaptchaSiteKey = async (): Promise<{ siteKey: string; enabled: boolean }> => {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "recaptcha")
      .single();

    if (data?.value) {
      return {
        siteKey: data.value.siteKey || "",
        enabled: data.value.enabled || false,
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
export default function ReCaptcha({ action, onVerify, onError, onLoad }: ReCaptchaProps) {
  const [siteKey, setSiteKey] = useState<string>("");
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const executedRef = useRef(false);

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

  // Load reCAPTCHA script
  useEffect(() => {
    if (!enabled || !siteKey || loaded) return;

    // Check if script already exists
    if (document.querySelector(`script[src*="recaptcha"]`)) {
      setLoaded(true);
      return;
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
  }, [enabled, siteKey, loaded, onError, onLoad]);

  // Execute reCAPTCHA when ready
  const executeReCaptcha = useCallback(async () => {
    if (!enabled || !siteKey || executedRef.current) return;

    try {
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
      executedRef.current = true;
      onVerify(token);
    } catch (err) {
      console.error("reCAPTCHA execution error:", err);
      setError("reCAPTCHA verification failed");
      onError?.("reCAPTCHA execution failed");
    }
  }, [enabled, siteKey, action, onVerify, onError]);

  // Execute when loaded
  useEffect(() => {
    if (loaded && enabled && siteKey) {
      executeReCaptcha();
    }
  }, [loaded, enabled, siteKey, executeReCaptcha]);

  // Don't render anything visible for reCAPTCHA v3
  // The badge is shown by Google automatically (can be hidden with CSS if disclosed in privacy policy)
  if (error) {
    return (
      <div className="text-xs text-red-400">
        {error}
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
export function useReCaptcha(action: string) {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = useCallback((newToken: string) => {
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

  const ReCaptchaComponent = useCallback(() => (
    <ReCaptcha
      action={action}
      onVerify={handleVerify}
      onError={handleError}
      onLoad={handleLoad}
    />
  ), [action, handleVerify, handleError, handleLoad]);

  return {
    token,
    isLoading,
    error,
    ReCaptchaComponent,
  };
}
