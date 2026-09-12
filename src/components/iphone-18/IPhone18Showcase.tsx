"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { APPLE_MEDIA } from "@/components/banner/apple-media";
import { siteInfo } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

export type ModelId = "pro" | "promax" | "duo";

interface IPhone18ShowcaseProps {
  locale: Locale;
  initialModel?: ModelId;
}

/* -------------------------------------------------------------------------- */
/* Precision SVG Icons (No Emojis)                                            */
/* -------------------------------------------------------------------------- */

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.818-.981z" />
    </svg>
  );
}

function MailIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PlayIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function ExpandIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function CloseIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function TradeInIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 12 4-4 4 4" />
      <path d="M7 8v8a4 4 0 0 0 4 4h6" />
      <path d="m21 12-4 4-4-4" />
      <path d="M17 16V8a4 4 0 0 0-4-4H7" />
    </svg>
  );
}

function StoreIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M9 10a2 2 0 0 1 4 0 2 2 0 0 1 4 0" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ChevronDownIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckCircleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Component Implementation                                                   */
/* -------------------------------------------------------------------------- */

export default function IPhone18Showcase({ locale, initialModel = "pro" }: IPhone18ShowcaseProps) {
  const isDe = locale === "de";
  const [selectedModel, setSelectedModel] = useState<ModelId>(initialModel);
  const [activeMediaTab, setActiveMediaTab] = useState<"lineup" | "frontback" | "duoNight" | "duoWhite" | "video">(
    initialModel === "duo" ? "video" : "lineup"
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const selectModel = (model: ModelId) => {
    setSelectedModel(model);
    if (model === "duo") {
      setActiveMediaTab("video");
    } else if (model === "promax") {
      setActiveMediaTab("frontback");
    } else {
      setActiveMediaTab("lineup");
    }
  };

  // Lock body scroll during lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen]);

  // WhatsApp & Email prefilled links
  const waTextDe = encodeURIComponent(
    `Guten Tag Apfel Park Team, ich interessiere mich für das ${
      selectedModel === "pro"
        ? "Apple iPhone 18 Pro"
        : selectedModel === "promax"
        ? "Apple iPhone 18 Pro Max"
        : "Apple iPhone Duo (Foldable)"
    }. Bitte senden Sie mir ein unverbindliches Angebot sowie Informationen zu Verfügbarkeit und Abholung in Hamburg.`
  );
  const waTextEn = encodeURIComponent(
    `Hello Apfel Park Team, I am inquiring about the ${
      selectedModel === "pro"
        ? "Apple iPhone 18 Pro"
        : selectedModel === "promax"
        ? "Apple iPhone 18 Pro Max"
        : "Apple iPhone Duo (Foldable)"
    }. Please provide a quotation, availability timeframe, and store pickup options in Hamburg.`
  );
  const whatsappUrl = `https://wa.me/${siteInfo.whatsapp}?text=${isDe ? waTextDe : waTextEn}`;

  const emailSubject = encodeURIComponent(
    isDe
      ? `Anfrage: Apple ${
          selectedModel === "pro" ? "iPhone 18 Pro" : selectedModel === "promax" ? "iPhone 18 Pro Max" : "iPhone Duo"
        }`
      : `Inquiry: Apple ${
          selectedModel === "pro" ? "iPhone 18 Pro" : selectedModel === "promax" ? "iPhone 18 Pro Max" : "iPhone Duo"
        }`
  );
  const emailUrl = `mailto:${siteInfo.email}?subject=${emailSubject}`;

  // Concise manufacturer-confirmed specifications; see linked Apple sources.
  const specs = [
    { category: isDe ? "Display" : "Display", pro: isDe ? "6,3\" Super Retina XDR OLED · ProMotion" : "6.3\" Super Retina XDR OLED · ProMotion", promax: isDe ? "6,9\" Super Retina XDR OLED · ProMotion" : "6.9\" Super Retina XDR OLED · ProMotion", duo: isDe ? "7,6\" innen + 5,4\" außen · OLED" : "7.6\" inner + 5.4\" outer · OLED" },
    { category: isDe ? "Prozessor" : "Processor", pro: isDe ? "A20 Pro · 6-Core CPU · 7-Core GPU" : "A20 Pro · 6-core CPU · 7-core GPU", promax: isDe ? "A20 Pro · 6-Core CPU · 7-Core GPU" : "A20 Pro · 6-core CPU · 7-core GPU", duo: isDe ? "A20 Pro" : "A20 Pro" },
    { category: isDe ? "Kapazitäten" : "Capacities", pro: isDe ? "256 / 512 GB / 1 / 2 TB" : "256 / 512 GB / 1 / 2 TB", promax: isDe ? "256 / 512 GB / 1 / 2 TB" : "256 / 512 GB / 1 / 2 TB", duo: isDe ? "256 / 512 GB / 1 / 2 TB" : "256 / 512 GB / 1 / 2 TB" },
    { category: isDe ? "Kameras" : "Cameras", pro: isDe ? "48-MP-Triple-System · variable Hauptblende · 4x Tele" : "48 MP triple system · variable main aperture · 4x telephoto", promax: isDe ? "48-MP-Triple-System · 8x in optischer Qualität" : "48 MP triple system · 8x optical-quality telephoto", duo: isDe ? "48 MP Hauptkamera + 48 MP Ultraweitwinkel" : "48 MP main + 48 MP ultrawide" },
    { category: isDe ? "Videowiedergabe (Hersteller-Laborwerte)" : "Video playback (manufacturer lab figures)", pro: isDe ? "Bis zu 34 Std.; tatsächliche Laufzeit variiert" : "Up to 34 hours; actual runtime varies", promax: isDe ? "Bis zu 43 Std.; tatsächliche Laufzeit variiert" : "Up to 43 hours; actual runtime varies", duo: isDe ? "Bis zu 44 Std. außen / 31 Std. innen" : "Up to 44 hours outer / 31 hours inner" },
    { category: isDe ? "Gehäuse" : "Body", pro: isDe ? "Aluminium-Unibody · Ceramic Shield" : "Aluminium unibody · Ceramic Shield", promax: isDe ? "Aluminium-Unibody · Ceramic Shield" : "Aluminium unibody · Ceramic Shield", duo: isDe ? "Faltbares Titandesign · 5,2 mm geöffnet / 11,3 mm geschlossen" : "Foldable titanium design · 5.2 mm open / 11.3 mm closed" },
    { category: isDe ? "Biometrie" : "Biometrics", pro: isDe ? "Face ID" : "Face ID", promax: isDe ? "Face ID" : "Face ID", duo: isDe ? "Touch ID in der Seitentaste" : "Touch ID in the side button" },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-gold selection:text-black">
      {/* Editorial Sub-Navigation & Breadcrumb Bar */}
      <div className="border-b border-border/70 bg-surface/40 py-2.5 backdrop-blur-sm">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 text-xs">
          <nav className="flex items-center gap-2 text-muted" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-gold transition-colors">
              {isDe ? "Startseite" : "Home"}
            </Link>
            <span className="text-border">/</span>
            <Link href={`/${locale}/store`} className="hover:text-gold transition-colors">
              {isDe ? "Store" : "Store"}
            </Link>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">
              {selectedModel === "duo"
                ? "iPhone Duo"
                : selectedModel === "promax"
                ? "iPhone 18 Pro Max"
                : "iPhone 18 Pro"}
            </span>
          </nav>

          <div className="flex items-center gap-2 text-muted">
            <span className="size-1.5 rounded-full bg-gold" />
            <span>{isDe ? "Hamburg Boutique & Bundesweiter Versand" : "Hamburg Boutique & Nationwide Shipping"}</span>
          </div>
        </div>
      </div>

      {/* Editorial Architectural Hero */}
      <header className="relative border-b border-border/80 bg-background pt-12 pb-14 md:pt-18 md:pb-20">
        <div className="container-page relative">
          <div className="mx-auto max-w-4xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-gold">
              <span>
                {selectedModel === "duo"
                  ? (isDe ? "Apple Foldable Premiere • 2026" : "Apple Foldable Premiere • 2026")
                  : selectedModel === "promax"
                  ? (isDe ? "Apple Max Flaggschiff • 2026" : "Apple Max Flagship • 2026")
                  : (isDe ? "Apple Flaggschiff-Generation 2026" : "Apple Flagship Generation 2026")}
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              {selectedModel === "duo" ? (
                <>
                  iPhone Duo
                  <span className="block text-2xl sm:text-4xl lg:text-5xl font-medium text-muted mt-2">
                    {isDe ? "Apples erstes Foldable aus Titan" : "Apple's First Titanium Foldable"}
                  </span>
                </>
              ) : selectedModel === "promax" ? (
                <>
                  iPhone 18 Pro Max
                  <span className="block text-2xl sm:text-4xl lg:text-5xl font-medium text-muted mt-2">
                    {isDe ? "6,9\" Super Retina XDR Flaggschiff" : "6.9\" Super Retina XDR Flagship"}
                  </span>
                </>
              ) : (
                <>
                  iPhone 18 Pro
                  <span className="block text-2xl sm:text-4xl lg:text-5xl font-medium text-muted mt-2">
                    {isDe ? "Pro Max und das neue iPhone Duo" : "Pro Max and The New iPhone Duo"}
                  </span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted leading-relaxed text-balance">
              {selectedModel === "duo"
                ? (isDe
                  ? "Apples erstes faltbares Smartphone mit nahtlosem 7,6-Zoll-OLED-Canvas, 5,4-Zoll-Cover-Display, Titanscharnier und der vollen Power des A20 Pro 2nm-Chips."
                  : "Apple's first foldable smartphone featuring a seamless 7.6-inch inner OLED canvas, 5.4-inch outer cover screen, titanium folding hinge, and 2nm A20 Pro silicon.")
                : selectedModel === "promax"
                ? (isDe
                  ? "iPhone 18 Pro Max mit 6,9-Zoll-Display, A20 Pro und 48-MP-Pro-Fusion-Kamerasystem. Apple nennt bis zu 43 Stunden Videowiedergabe unter Testbedingungen."
                  : "iPhone 18 Pro Max with a 6.9-inch display, A20 Pro and 48 MP Pro Fusion camera system. Apple lists up to 43 hours of video playback under test conditions.")
                : (isDe
                  ? "Entwickelt für kompromisslose Leistung. Der A20 Pro Prozessor in 2-Nanometer-Architektur, eine 48 MP Pro Fusion Optik mit variabler Blende von f/1.48 bis f/4.0 und Apples erstes faltbares Meisterwerk aus Titan."
                  : "Engineered without compromise. Powered by the 2nm Apple A20 Pro architecture, a 48MP Pro Fusion system with variable f/1.48–f/4.0 aperture, and Apple's inaugural titanium foldable.")}
            </p>

            {/* Restrained Luxury CTA Actions */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-xs sm:text-sm font-semibold transition-all hover:bg-gold hover:text-black"
              >
                <WhatsAppIcon className="size-4" />
                <span>{isDe ? "Angebot via WhatsApp anfragen" : "Request Quote via WhatsApp"}</span>
              </a>

              <a
                href={emailUrl}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-gold hover:text-gold"
              >
                <MailIcon className="size-4" />
                <span>{isDe ? "Per E-Mail anfragen" : "Request Quote via Email"}</span>
              </a>

              <Link
                href={`/${locale}/repairs`}
                className="inline-flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                <span>{isDe ? "Altgerät in Zahlung geben" : "Trade in current device"}</span>
                <span className="text-gold">→</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Model Selection Segmented Control */}
      <section className="sticky top-[var(--site-header-h,4.5rem)] z-20 border-b border-border/80 bg-background/90 backdrop-blur-md py-3">
        <div className="container-page">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-surface/80 p-1 sm:mx-auto sm:flex sm:w-auto sm:rounded-full">
            <Link
              href={`/${locale}/iphone-18-pro`}
              onClick={() => selectModel("pro")}
              className={`flex min-h-[44px] items-center justify-center rounded-xl px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all sm:min-h-[38px] sm:whitespace-nowrap sm:rounded-full sm:px-6 sm:py-1.5 sm:text-sm ${
                selectedModel === "pro"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              iPhone 18 Pro
            </Link>
            <Link
              href={`/${locale}/iphone-18-pro-max`}
              onClick={() => selectModel("promax")}
              className={`flex min-h-[44px] items-center justify-center rounded-xl px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all sm:min-h-[38px] sm:whitespace-nowrap sm:rounded-full sm:px-6 sm:py-1.5 sm:text-sm ${
                selectedModel === "promax"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              iPhone 18 Pro Max
            </Link>
            <Link
              href={`/${locale}/iphone-duo`}
              onClick={() => selectModel("duo")}
              className={`flex min-h-[44px] items-center justify-center rounded-xl px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all sm:min-h-[38px] sm:whitespace-nowrap sm:rounded-full sm:px-6 sm:py-1.5 sm:text-sm ${
                selectedModel === "duo"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              iPhone Duo (Foldable)
            </Link>
          </div>
        </div>
      </section>

      {/* Studio Showcase & Interactive Stage */}
      <section className="py-10 md:py-16 border-b border-border/70">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            {/* Left: Studio Stage Canvas */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl border border-border bg-surface/40 p-6 md:p-10 shadow-lg overflow-hidden">
                {/* Media View Controller */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-6">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("lineup")}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        activeMediaTab === "lineup"
                          ? "bg-foreground text-background"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {isDe ? "Farbauswahl" : "Colour selection"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("frontback")}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        activeMediaTab === "frontback"
                          ? "bg-foreground text-background"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {isDe ? "Vorder- & Rückseite" : "Front & Back"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("duoNight")}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        activeMediaTab === "duoNight"
                          ? "bg-foreground text-background"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {isDe ? "Duo Dunkel" : "Duo Dark"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("duoWhite")}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        activeMediaTab === "duoWhite"
                          ? "bg-foreground text-background"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      {isDe ? "Duo Hell" : "Duo Light"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("video")}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        activeMediaTab === "video"
                          ? "bg-foreground text-background"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      <PlayIcon className="size-2.5" />
                      <span>{isDe ? "Film (4K)" : "Film (4K)"}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-gold transition-colors"
                  >
                    <ExpandIcon className="size-3.5" />
                    <span>{isDe ? "Vollbild" : "Fullscreen"}</span>
                  </button>
                </div>

                {/* Media Container */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full flex items-center justify-center">
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
                    aria-hidden="true"
                  />
                  {activeMediaTab === "lineup" && (
                    <Image
                      src={APPLE_MEDIA.proLineup}
                      alt="Apple iPhone 18 Pro Lineup Finishes"
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                    />
                  )}
                  {activeMediaTab === "frontback" && (
                    <Image
                      src={APPLE_MEDIA.proFrontBack}
                      alt="Apple iPhone 18 Pro Front and Back Perspective"
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                    />
                  )}
                  {activeMediaTab === "duoNight" && (
                    <Image
                      src={APPLE_MEDIA.duoNight}
                      alt="Apple iPhone Duo Foldable Night Finish"
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                    />
                  )}
                  {activeMediaTab === "duoWhite" && (
                    <Image
                      src={APPLE_MEDIA.duoWhite}
                      alt="Apple iPhone Duo Foldable Light Finish"
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                    />
                  )}
                  {activeMediaTab === "video" && (
                    <video
                      src={APPLE_MEDIA.duoVideo}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="max-h-full max-w-full rounded-2xl shadow-xl"
                    />
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted">
                  <span>
                    {selectedModel === "duo"
                      ? isDe ? "iPhone Duo mit Titanscharnier" : "iPhone Duo with titanium folding hinge"
                      : isDe ? "Aluminium-Unibody" : "Aluminium unibody"}
                  </span>
                  <span className="font-mono text-[11px]">APFEL PARK • HAMBURG</span>
                </div>
              </div>
            </div>

            {/* Right: Technical Summary & Concierge Request */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-gold">
                  {selectedModel === "duo"
                    ? isDe ? "Foldable Architektur" : "Foldable Architecture"
                    : isDe ? "Pro Engineering" : "Pro Engineering"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {selectedModel === "pro" && "iPhone 18 Pro (6,3\")"}
                  {selectedModel === "promax" && "iPhone 18 Pro Max (6,9\")"}
                  {selectedModel === "duo" && "iPhone Duo (7,6\" & 5,4\")"}
                </h2>
                <p className="text-sm sm:text-base text-muted leading-relaxed">
                  {selectedModel === "duo"
                    ? isDe
                      ? "Apples erstes faltbares Meisterwerk. Ein nahtloses 7,6-Zoll-OLED-Innendisplay trifft auf ein kompaktes 5,4-Zoll-Außendisplay, geschützt von einem neuartigen Titanscharnier mit faltbarem Innendisplay."
                      : "Apple's first foldable masterpiece. A seamless 7.6-inch inner OLED canvas meets a compact 5.4-inch outer cover screen, engineered with a titanium folding hinge."
                    : isDe
                    ? "Der neue Maßstab in der mobilen Bild- und Videoverarbeitung. Mechanisch variable Blende (f/1.48 bis f/4.0), A20 Pro Rechenplattform und unübertroffene Effizienz durch TSMCs 2nm-Verfahren."
                    : "The definitive creative instrument. Physical mechanical variable aperture (f/1.48 to f/4.0), the A20 Pro platform, and unmatched efficiency via TSMC's 2nm node."}
                </p>
              </div>

              {/* Technical Metrics Quartet */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5">
                  <div className="text-xs text-muted uppercase tracking-wider">{isDe ? "Architektur" : "Architecture"}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">2 nm A20 Pro</div>
                  <div className="text-[11px] text-muted">6-Core CPU · 7-Core GPU</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5">
                  <div className="text-xs text-muted uppercase tracking-wider">{isDe ? "Optik" : "Optics"}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">48 MP</div>
                  <div className="text-[11px] text-muted">Pro: variable Blende / aperture</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5">
                  <div className="text-xs text-muted uppercase tracking-wider">{isDe ? "Speicher" : "Memory"}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">256 GB–2 TB</div>
                  <div className="text-[11px] text-muted">Kapazität / capacity</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5">
                  <div className="text-xs text-muted uppercase tracking-wider">{isDe ? "Laden" : "Charging"}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">USB-C · MagSafe</div>
                  <div className="text-[11px] text-muted">Ladezubehör separat / chargers separate</div>
                </div>
              </div>

              {/* Concierge Quotation Module */}
              <div className="rounded-2xl border border-border bg-surface/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <div className="text-[11px] font-semibold text-gold uppercase tracking-wider">
                      {isDe ? "Preis & Verfügbarkeit" : "Price & availability"}
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {isDe ? "Unverbindliche Anfrage" : "Non-binding inquiry"}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green">
                    <span className="size-2 rounded-full bg-green" />
                    <span>{isDe ? "Hamburg Store" : "Hamburg Store"}</span>
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Fordere dein persönliches Angebot mit verbindlichem Tagespreis für dein gewünschtes Speichermodell und deine Wunschfarbe an."
                    : "Request a bespoke quote with the verified daily market price for your desired storage capacity and finish."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-gold hover:text-black"
                  >
                    <WhatsAppIcon className="size-3.5" />
                    <span>{isDe ? "WhatsApp Angebot" : "WhatsApp Quote"}</span>
                  </a>
                  <a
                    href={emailUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-gold hover:text-gold"
                  >
                    <MailIcon className="size-3.5" />
                    <span>{isDe ? "E-Mail Anfrage" : "Email Inquiry"}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Specs Comparison Matrix */}
      <section className="py-14 md:py-20 bg-surface/20 border-b border-border/70">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center mb-10 space-y-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gold">
              {isDe ? "Verifizierte GSMArena Daten" : "Verified GSMArena Data"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {isDe ? "Technische Spezifikationen im Vergleich" : "Technical Specifications Comparison"}
            </h2>
            <p className="text-sm sm:text-base text-muted">
              {isDe
                ? "Detaillierte Gegenüberstellung aller Hardware-Parameter der 2026er Apple Flaggschiffe."
                : "Detailed hardware comparison across all parameters of the 2026 Apple flagship generation."}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-strong/60 text-xs font-semibold text-muted">
                  <th className="p-4 sm:p-5 w-1/4">{isDe ? "Komponente" : "Component"}</th>
                  <th className={`p-4 sm:p-5 w-1/4 ${selectedModel === "pro" ? "text-gold font-bold bg-gold/5" : ""}`}>
                    iPhone 18 Pro
                  </th>
                  <th className={`p-4 sm:p-5 w-1/4 ${selectedModel === "promax" ? "text-gold font-bold bg-gold/5" : ""}`}>
                    iPhone 18 Pro Max
                  </th>
                  <th className={`p-4 sm:p-5 w-1/4 ${selectedModel === "duo" ? "text-gold font-bold bg-gold/5" : ""}`}>
                    iPhone Duo (Foldable)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {specs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-strong/30 transition-colors">
                    <td className="p-4 sm:p-5 font-medium text-foreground align-top">
                      {row.category}
                    </td>
                    <td className={`p-4 sm:p-5 text-muted align-top leading-relaxed ${selectedModel === "pro" ? "bg-gold/5 font-medium text-foreground" : ""}`}>
                      {row.pro}
                    </td>
                    <td className={`p-4 sm:p-5 text-muted align-top leading-relaxed ${selectedModel === "promax" ? "bg-gold/5 font-medium text-foreground" : ""}`}>
                      {row.promax}
                    </td>
                    <td className={`p-4 sm:p-5 text-muted align-top leading-relaxed ${selectedModel === "duo" ? "bg-gold/5 font-medium text-foreground" : ""}`}>
                      {row.duo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Editorial Service Pillars (No Emojis) */}
      <section className="py-14 md:py-20 border-b border-border/70">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-4">
              <div className="size-11 rounded-xl border border-border bg-surface flex items-center justify-center text-gold">
                <TradeInIcon className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isDe ? "Trade-In & Altgeräte-Ankauf" : "Trade-In & Buyback Bonus"}
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {isDe
                  ? "Bringe dein aktuelles iPhone (z.B. iPhone 14, 15, 16 oder 17) zu Apfel Park. Der geprüfte Restwert wird direkt vom Anschaffungspreis deines neuen Geräts abgezogen."
                  : "Trade in your current iPhone (e.g. iPhone 14, 15, 16, or 17). The agreed trade-in value is deducted directly from the purchase price of your new device."}
              </p>
              <Link href={`/${locale}/repairs`} className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
                <span>{isDe ? "Ankaufswert unverbindlich berechnen" : "Calculate trade-in value"}</span>
                <span>→</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-4">
              <div className="size-11 rounded-xl border border-border bg-surface flex items-center justify-center text-gold">
                <StoreIcon className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isDe ? "Boutique Abholung in Hamburg" : "Boutique Pickup in Hamburg"}
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {isDe
                  ? `Persönliche Abholung und Beratung direkt im Store (${siteInfo.address.street}, 21109 Hamburg-Wilhelmsburg). Datenübertragung und Ersteinrichtung auf Wunsch inklusive.`
                  : `Personal collection and consultation directly at our store (${siteInfo.address.street}, 21109 Hamburg). Complimentary data transfer and initial configuration available.`}
              </p>
              <div className="text-xs text-muted font-medium">
                {isDe ? "Mo – Sa: 09:30 – 20:00 Uhr" : "Mon – Sat: 09:30 – 20:00"}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-4">
              <div className="size-11 rounded-xl border border-border bg-surface flex items-center justify-center text-gold">
                <ShieldCheckIcon className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isDe ? "Versicherter DHL Versand" : "Insured Express Dispatch"}
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {isDe
                  ? "Sichere und vollständig versicherte Zustellung deutschlandweit via DHL mit Live-Sendungsverfolgung und neutraler Sicherheitsverpackung."
                  : "Fully insured nationwide delivery across Germany via DHL with real-time package tracking and secure packaging."}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-green">
                <CheckCircleIcon className="size-3.5" />
                <span>{isDe ? "Geprüfte Händlergarantie" : "Verified Dealer Warranty"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Apple-Style FAQ */}
      <section className="py-14 md:py-20 bg-surface/20">
        <div className="container-page max-w-3xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gold">FAQ</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isDe ? "Häufig gestellte Fragen" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="divide-y divide-border/70 border-y border-border/70">
            <details className="group py-5 transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground list-none">
                <span>{isDe ? "Ab wann sind iPhone 18 Pro und iPhone Duo lieferbar?" : "When will iPhone 18 Pro and iPhone Duo be available?"}</span>
                <span className="text-muted transition-transform group-open:rotate-180">
                  <ChevronDownIcon className="size-4" />
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {isDe
                  ? "Bitte frage Modell, Speicher und Farbe unverbindlich an. Wir bestätigen Preis, Bestand und Liefertermin individuell. Eine Anfrage ist noch keine Bestellung oder Reservierungszusage."
                  : "Ask about the model, storage and colour without obligation. We confirm price, stock and delivery individually. An inquiry is not an order or a guaranteed reservation."}
              </p>
            </details>

            <details className="group py-5 transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground list-none">
                <span>{isDe ? "Wie erhalte ich ein verbindliches Preisangebot?" : "How do I request a binding quotation?"}</span>
                <span className="text-muted transition-transform group-open:rotate-180">
                  <ChevronDownIcon className="size-4" />
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {isDe
                  ? "Nutze einfach die WhatsApp-Direktanfrage oder schreibe uns eine E-Mail an info@apfel-park.de mit Angabe deines Wunschmodells, der Speichergröße und der Farbe. Unser Team antwortet umgehend mit einem transparenten Angebot."
                  : "Simply click the WhatsApp quote button or email info@apfel-park.de stating your preferred model, color finish, and storage tier. Our team provides transparent pricing promptly."}
              </p>
            </details>

            <details className="group py-5 transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground list-none">
                <span>{isDe ? "Sind die Geräte vertragsfrei und für alle Netze entsperrt?" : "Are devices factory unlocked and contract-free?"}</span>
                <span className="text-muted transition-transform group-open:rotate-180">
                  <ChevronDownIcon className="size-4" />
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {isDe
                  ? "Ja. Alle über Apfel Park bezogenen Neugeräte sind 100% vertragsfrei (ohne SIM-Lock) und können mit allen deutschen sowie internationalen SIM-Karten und eSIM-Profilen genutzt werden."
                  : "Yes. All units delivered by Apfel Park are 100% factory unlocked without contract ties and function seamlessly with any physical SIM or eSIM worldwide."}
              </p>
            </details>

            <details className="group py-5 transition-colors">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground list-none">
                <span>{isDe ? "Kann ich mein altes Smartphone direkt in Zahlung geben?" : "Can I trade in an existing smartphone directly?"}</span>
                <span className="text-muted transition-transform group-open:rotate-180">
                  <ChevronDownIcon className="size-4" />
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {isDe
                  ? "Selbstverständlich. Wir bewerten dein bisheriges Gerät fair und transparent. Der ermittelte Wert kann direkt mit dem Kaufpreis des iPhone 18 Pro oder Duo verrechnet werden."
                  : "Certainly. We provide transparent device assessments. The agreed trade-in value is credited immediately against your new order."}
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Lightbox Modal (No Emojis, Clean SVG Controls) */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-medium text-white hover:bg-white/20 transition-colors"
            >
              <CloseIcon className="size-3.5" />
              <span>{isDe ? "Schließen" : "Close"}</span>
            </button>
            {activeMediaTab === "lineup" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={APPLE_MEDIA.proLineup} alt="iPhone 18 Pro Lineup" className="max-h-[80vh] object-contain" />
            )}
            {activeMediaTab === "frontback" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={APPLE_MEDIA.proFrontBack} alt="iPhone 18 Pro Front and Back" className="max-h-[80vh] object-contain" />
            )}
            {activeMediaTab === "duoNight" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={APPLE_MEDIA.duoNight} alt="iPhone Duo Night Finish" className="max-h-[80vh] object-contain" />
            )}
            {activeMediaTab === "duoWhite" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={APPLE_MEDIA.duoWhite} alt="iPhone Duo White Finish" className="max-h-[80vh] object-contain" />
            )}
            {activeMediaTab === "video" && (
              <video src={APPLE_MEDIA.duoVideo} controls autoPlay className="max-h-[80vh] rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
