"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CONSENT_EVENT_NAME,
  CONSENT_OPEN_EVENT_NAME,
  type ConsentMode,
  readConsentMode,
  writeConsentMode,
} from "@/lib/consent";
import { clearMapConsent } from "@/lib/map-consent";

type Props = {
  lang: "de" | "en";
};

const copy = {
  de: {
    title: "Datenschutz & Cookies",
    body:
      "Notwendige Cookies sichern Sprache und Sitzungen. Karten, Analyse- und Marketingdienste laden erst nach deiner Zustimmung.",
    necessary: "Nur notwendige",
    external: "Externe Dienste erlauben",
    manage: "Cookie-Einstellungen",
    privacy: "Datenschutzerklärung",
  },
  en: {
    title: "Privacy & cookies",
    body:
      "Necessary cookies preserve language and secure sessions. Maps, analytics, and marketing services load only with your consent.",
    necessary: "Necessary only",
    external: "Allow external services",
    manage: "Cookie settings",
    privacy: "Privacy policy",
  },
} as const;

const subscribeToConsent = (onStoreChange: () => void) => {
  window.addEventListener(CONSENT_EVENT_NAME, onStoreChange);
  return () => window.removeEventListener(CONSENT_EVENT_NAME, onStoreChange);
};

const getServerConsent = (): ConsentMode => "unset";

export default function CookieBanner({ lang }: Props) {
  const text = copy[lang];
  const mode = useSyncExternalStore(subscribeToConsent, readConsentMode, getServerConsent);
  const [forceOpen, setForceOpen] = useState(false);
  const visible = forceOpen || mode === "unset";
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const necessaryButtonRef = useRef<HTMLButtonElement | null>(null);

  const applyConsent = (mode: "necessary" | "external") => {
    setForceOpen(false);
    if (mode === "necessary") clearMapConsent();
    writeConsentMode(mode);
  };

  useEffect(() => {
    const handleOpen = () => {
      setForceOpen(true);
    };

    window.addEventListener(CONSENT_OPEN_EVENT_NAME, handleOpen);

    return () => {
      window.removeEventListener(CONSENT_OPEN_EVENT_NAME, handleOpen);
    };
  }, []);

  useEffect(() => {
    const element = bannerRef.current;
    const root = document.documentElement;

    if (!visible || !element) {
      root.style.setProperty("--apfel-cookie-banner-height", "0px");
      return;
    }

    const updateHeight = () => {
      root.style.setProperty("--apfel-cookie-banner-height", `${element.offsetHeight}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
      root.style.setProperty("--apfel-cookie-banner-height", "0px");
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.documentElement.dataset.consentDialog = "open";
    document.body.style.overflow = "hidden";
    necessaryButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !bannerRef.current) return;
      const focusable = [...bannerRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      delete document.documentElement.dataset.consentDialog;
      previousFocus?.focus();
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div ref={bannerRef} className="max-h-[100dvh] w-full overflow-y-auto overscroll-contain border-t border-border/70 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="container-page flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p id="cookie-consent-title" className="text-sm font-semibold text-foreground">{text.title}</p>
            <p className="mt-1 text-sm text-muted">
              {text.body}{" "}
              <a href={`/${lang}/privacy`} className="inline-flex min-h-11 items-center font-medium text-gold hover:text-gold-soft">
                {text.privacy}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              ref={necessaryButtonRef}
              type="button"
              onClick={() => applyConsent("necessary")}
              className="min-h-12 rounded-full border border-border/70 bg-background/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground"
            >
              {text.necessary}
            </button>
            <button
              type="button"
              onClick={() => applyConsent("external")}
              className="min-h-12 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold"
            >
              {text.external}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
