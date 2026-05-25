"use client";

import { useEffect, useState } from "react";

import { CONSENT_EVENT_NAME, type ConsentMode, readConsentMode, writeConsentMode } from "@/lib/consent";

type Props = {
  lang: "de" | "en";
  title: string;
  src: string;
  directionsUrl: string;
  className?: string;
};

const copy = {
  de: {
    title: "Karte mit externer Zustimmung laden",
    body:
      "Die eingebettete Google-Karte wird erst nach deiner Zustimmung zu externen Diensten geladen. Dabei können Daten an Google übermittelt werden.",
    button: "Karte laden",
    link: "Direkt in Google Maps öffnen",
  },
  en: {
    title: "Load map with external consent",
    body:
      "The embedded Google map is loaded only after you allow external services. This may transfer data to Google.",
    button: "Load map",
    link: "Open directly in Google Maps",
  },
} as const;

export default function ExternalMapEmbed({ lang, title, src, directionsUrl, className = "h-96 w-full" }: Props) {
  const text = copy[lang];
  const [mode, setMode] = useState<ConsentMode>(() => readConsentMode());

  useEffect(() => {
    const handleChange = (event: Event) => {
      setMode((event as CustomEvent<ConsentMode>).detail ?? readConsentMode());
    };

    window.addEventListener(CONSENT_EVENT_NAME, handleChange as EventListener);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, handleChange as EventListener);
    };
  }, []);

  if (mode !== "external") {
    return (
      <div className="rounded-3xl border border-border/70 bg-surface/60 p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground">{text.title}</h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted">{text.body}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => writeConsentMode("external")}
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
