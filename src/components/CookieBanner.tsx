"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CONSENT_EVENT_NAME,
  CONSENT_OPEN_EVENT_NAME,
  type ConsentMode,
  readConsentMode,
  writeConsentMode,
} from "@/lib/consent";

type Props = {
  lang: "de" | "en";
};

const copy = {
  de: {
    title: "Datenschutz & Cookies",
    body:
      "Wir verwenden notwendige Cookies für Sprache, Theme und sichere Admin-Sitzungen. Externe Dienste und Marketing-Integrationen wie Google Maps, Google reCAPTCHA sowie gegebenenfalls Meta Pixel, TikTok Pixel und Google Analytics laden wir erst nach deiner Zustimmung.",
    necessary: "Nur notwendige",
    external: "Externe Dienste erlauben",
    manage: "Cookie-Einstellungen",
    privacy: "Datenschutzerklärung",
  },
  en: {
    title: "Privacy & cookies",
    body:
      "We use necessary cookies for language, theme, and secure admin sessions. External services and marketing integrations such as Google Maps, Google reCAPTCHA, and, if configured, Meta Pixel, TikTok Pixel, and Google Analytics are loaded only after your consent.",
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

  const applyConsent = (mode: "necessary" | "external") => {
    setForceOpen(false);
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

  if (!visible) {
    return null;
  }

  return (
    <div ref={bannerRef} className="fixed inset-x-0 bottom-0 z-[160] border-t border-border/70 bg-surface/95 backdrop-blur">
      <div className="container-page flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-foreground">{text.title}</p>
          <p className="mt-1 text-sm text-muted">
            {text.body}{" "}
            <a href={`/${lang}/privacy`} className="font-medium text-gold hover:text-gold-soft">
              {text.privacy}
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => applyConsent("necessary")}
            className="rounded-full border border-border/70 bg-background/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground"
          >
            {text.necessary}
          </button>
          <button
            type="button"
            onClick={() => applyConsent("external")}
            className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold"
          >
            {text.external}
          </button>
        </div>
      </div>
    </div>
  );
}
