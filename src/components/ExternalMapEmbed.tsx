"use client";

import { useSyncExternalStore } from "react";

import { CONSENT_EVENT_NAME, readConsentMode } from "@/lib/consent";
import {
  MAP_CONSENT_EVENT_NAME,
  allowMapConsent,
  mapConsentAllowsEmbed,
  readMapConsent,
} from "@/lib/map-consent";

type Props = {
  lang: "de" | "en";
  title: string;
  src: string;
  directionsUrl: string;
  className?: string;
};

const copy = {
  de: {
    title: "Google-Karte laden",
    body:
      "Nur diese eingebettete Karte wird nach deiner Zustimmung geladen. Dabei können Daten an Google übermittelt werden; Analyse- und Marketingdienste bleiben unverändert deaktiviert.",
    button: "Karte laden",
    link: "Direkt in Google Maps öffnen",
  },
  en: {
    title: "Load Google map",
    body:
      "Only this embedded map loads after you consent. This may transfer data to Google; analytics and marketing services remain disabled.",
    button: "Load map",
    link: "Open directly in Google Maps",
  },
} as const;

const subscribeToConsent = (onStoreChange: () => void) => {
  window.addEventListener(CONSENT_EVENT_NAME, onStoreChange);
  window.addEventListener(MAP_CONSENT_EVENT_NAME, onStoreChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT_NAME, onStoreChange);
    window.removeEventListener(MAP_CONSENT_EVENT_NAME, onStoreChange);
  };
};

const getConsentSnapshot = () => mapConsentAllowsEmbed(readConsentMode(), readMapConsent());
const getServerConsent = () => false;

export default function ExternalMapEmbed({ lang, title, src, directionsUrl, className = "h-96 w-full" }: Props) {
  const text = copy[lang];
  const allowed = useSyncExternalStore(subscribeToConsent, getConsentSnapshot, getServerConsent);

  if (!allowed) {
    return (
      <div className="rounded-3xl border border-border/70 bg-surface/60 p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground">{text.title}</h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted">{text.body}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={allowMapConsent}
            className="btn-primary"
          >
            {text.button}
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            {text.link}
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      title={title}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={className}
    />
  );
}
