"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  // GSMArena Specifications Matrix
  const specs = [
    {
      category: isDe ? "Display & Panel" : "Display & Panel",
      pro: isDe
        ? "6,3\" Super Retina XDR OLED (2622 × 1206, 460 ppi), 1–120Hz ProMotion, Always-On, 3.000 Nits Spitzenhelligkeit"
        : "6.3\" Super Retina XDR OLED (2622 × 1206, 460 ppi), 1–120Hz ProMotion, Always-On, 3,000 nits peak",
      promax: isDe
        ? "6,9\" Super Retina XDR OLED (2868 × 1320, 460 ppi), 1–120Hz ProMotion, Always-On, 3.000 Nits Spitzenhelligkeit"
        : "6.9\" Super Retina XDR OLED (2868 × 1320, 460 ppi), 1–120Hz ProMotion, Always-On, 3,000 nits peak",
      duo: isDe
        ? "7,6\" Faltbares LTPO OLED (Innen, 120Hz, Nano-Texture) + 5,4\" Cover Display (Außen, 120Hz)"
        : "7.6\" Foldable LTPO OLED (Inner, 120Hz, Anti-Crease) + 5.4\" Cover Display (Outer, 120Hz)",
    },
    {
      category: isDe ? "Prozessor & Neural Engine" : "Processor & Neural Engine",
      pro: isDe ? "Apple A20 Pro (TSMC 2nm Architektur), 6-Core CPU, 6-Core GPU, 16-Core Neural Engine" : "Apple A20 Pro (TSMC 2nm architecture), 6-Core CPU, 6-Core GPU, 16-Core Neural Engine",
      promax: isDe ? "Apple A20 Pro (TSMC 2nm Architektur), 6-Core CPU, 6-Core GPU, 16-Core Neural Engine" : "Apple A20 Pro (TSMC 2nm architecture), 6-Core CPU, 6-Core GPU, 16-Core Neural Engine",
      duo: isDe ? "Apple A20 Pro (TSMC 2nm) mit dedizierter Dual-Screen Multitasking Engine" : "Apple A20 Pro (TSMC 2nm) with dedicated Dual-Screen Multitasking Engine",
    },
    {
      category: isDe ? "Arbeitsspeicher & Kapazitäten" : "Unified Memory & Storage",
      pro: "12 GB LPDDR5X · 256 GB / 512 GB / 1 TB / 2 TB NVMe",
      promax: "12 GB LPDDR5X · 256 GB / 512 GB / 1 TB / 2 TB NVMe",
      duo: "12 GB LPDDR5X · 256 GB / 512 GB / 1 TB / 2 TB NVMe",
    },
    {
      category: isDe ? "Kamerasystem & Optik" : "Camera System & Optics",
      pro: isDe
        ? "48 MP Pro Fusion (f/1.48–f/4.0 variable mechanische Blende, Sensor-Shift OIS) + 48 MP Ultraweit + 48 MP 5x Tetraprism Tele"
        : "48 MP Pro Fusion (f/1.48–f/4.0 variable mechanical aperture, Sensor-Shift OIS) + 48 MP Ultra-Wide + 48 MP 5x Tetraprism Tele",
      promax: isDe
        ? "48 MP Pro Fusion (f/1.48–f/4.0 variable Blende) + 48 MP Ultraweit + 48 MP 5x Tetraprism Tele (10x verlustfreier Sensor-Zoom)"
        : "48 MP Pro Fusion (f/1.48–f/4.0 variable aperture) + 48 MP Ultra-Wide + 48 MP 5x Tetraprism Tele (10x lossless sensor zoom)",
      duo: isDe
        ? "Duales 48 MP Kamerasystem (48 MP Weitwinkel + 48 MP Ultraweit) + 12 MP Under-Display Frontkamera"
        : "Dual 48 MP System (48 MP Wide + 48 MP Ultra-Wide) + 12 MP Under-Display Front Camera",
    },
    {
      category: isDe ? "Akku & Ladeleistung" : "Battery & Charging",
      pro: isDe
        ? "4.288 mAh, 45W USB-PD Schnellladung (50% in ca. 20 Min.), 25W MagSafe / Qi2"
        : "4,288 mAh, 45W USB-PD wired fast charging (50% in ~20 min), 25W MagSafe / Qi2",
      promax: isDe
        ? "5.567 mAh (bis zu 35 Std. Videowiedergabe), 45W Schnellladung, 25W MagSafe / Qi2"
        : "5,567 mAh (up to 35 hrs video playback), 45W fast charging, 25W MagSafe / Qi2",
      duo: isDe
        ? "5.400 mAh Dual-Zellen-Architektur, 45W kabelgebunden, 25W MagSafe Wireless"
        : "5,400 mAh Dual-Cell Architecture, 45W wired, 25W MagSafe wireless",
    },
    {
      category: isDe ? "Gehäuse & Material" : "Build & Materials",
      pro: isDe
        ? "Grade 5 Titanrahmen mit Mikro-Strahloberfläche, Ceramic Shield 2 Front, IP68"
        : "Grade 5 Titanium frame micro-blasted, Ceramic Shield 2 front glass, IP68",
      promax: isDe
        ? "Grade 5 Titanrahmen mit Mikro-Strahloberfläche, Ceramic Shield 2 Front, IP68"
        : "Grade 5 Titanium frame micro-blasted, Ceramic Shield 2 front glass, IP68",
      duo: isDe
        ? "Grade 5 Titan Scharnier (Zero-Gap Hinge), 5,2 mm entfaltet / 11,3 mm geschlossen, IP68"
        : "Grade 5 Titanium Zero-Gap Hinge, 5.2 mm unfolded / 11.3 mm folded, IP68",
    },
    {
      category: isDe ? "Konnektivität & Sicherheit" : "Connectivity & Security",
      pro: "Wi-Fi 7, Bluetooth 6.0, Apple 5G C2 Modem, Ultra-Wideband 2, Face ID",
      promax: "Wi-Fi 7, Bluetooth 6.0, Apple 5G C2 Modem, Ultra-Wideband 2, Face ID",
      duo: "Wi-Fi 7, Bluetooth 6.0, Apple 5G C2 Modem, Thread, Touch ID im Einschalter",
    },
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
            <span className="font-medium text-foreground">iPhone 18 Pro &amp; Duo</span>
          </nav>

          <div className="flex items-center gap-2 text-muted">
            <span className="size-1.5 rounded-full bg-gold" />
            <span>{isDe ? "Hamburg Boutique &amp; Bundesweiter Versand" : "Hamburg Boutique &amp; Nationwide Shipping"}</span>
          </div>
        </div>
      </div>

      {/* Editorial Architectural Hero */}
      <header className="relative border-b border-border/80 bg-background pt-12 pb-14 md:pt-18 md:pb-20">
        <div className="container-page relative">
          <div className="mx-auto max-w-4xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-gold">
              <span>{isDe ? "Apple Flaggschiff-Generation 2026" : "Apple Flagship Generation 2026"}</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              iPhone 18 Pro
              <span className="block text-2xl sm:text-4xl lg:text-5xl font-medium text-muted mt-2">
                {isDe ? "Pro Max &amp; das neue iPhone Duo" : "Pro Max &amp; The New iPhone Duo"}
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted leading-relaxed text-balance">
              {isDe
                ? "Entwickelt für kompromisslose Leistung. Der A20 Pro Prozessor in 2-Nanometer-Architektur, eine 48 MP Pro Fusion Optik mit variabler Blende von f/1.48 bis f/4.0 und Apples erstes faltbares Meisterwerk aus Titan."
                : "Engineered without compromise. Powered by the 2nm Apple A20 Pro architecture, a 48MP Pro Fusion system with variable f/1.48–f/4.0 aperture, and Apple's inaugural Grade 5 titanium foldable."}
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
      <section className="sticky top-14 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md py-3">
        <div className="container-page flex items-center justify-center">
          <div className="inline-flex p-1 rounded-full border border-border bg-surface/80">
            <button
              type="button"
              onClick={() => selectModel("pro")}
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                selectedModel === "pro"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              iPhone 18 Pro
            </button>
            <button
              type="button"
              onClick={() => selectModel("promax")}
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                selectedModel === "promax"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              iPhone 18 Pro Max
            </button>
            <button
              type="button"
              onClick={() => selectModel("duo")}
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                selectedModel === "duo"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              iPhone Duo (Foldable)
            </button>
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
                      {isDe ? "Titan Finishes" : "Titanium Finishes"}
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
                  {activeMediaTab === "lineup" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={APPLE_MEDIA.proLineup}
                      alt="Apple iPhone 18 Pro Lineup Finishes"
                      className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-102"
                    />
                  )}
                  {activeMediaTab === "frontback" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={APPLE_MEDIA.proFrontBack}
                      alt="Apple iPhone 18 Pro Front and Back Perspective"
                      className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-102"
                    />
                  )}
                  {activeMediaTab === "duoNight" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={APPLE_MEDIA.duoNight}
                      alt="Apple iPhone Duo Foldable Night Finish"
                      className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-102"
                    />
                  )}
                  {activeMediaTab === "duoWhite" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={APPLE_MEDIA.duoWhite}
                      alt="Apple iPhone Duo Foldable Light Finish"
                      className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-102"
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
                      ? isDe ? "iPhone Duo mit Zero-Gap Titanscharnier" : "iPhone Duo with zero-gap titanium hinge"
                      : isDe ? "Grade 5 Titanrahmen mit Mikro-Strahloberfläche" : "Grade 5 titanium frame with micro-blasted finish"}
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
                      ? "Apples erstes faltbares Meisterwerk. Ein nahtloses 7,6-Zoll-OLED-Innendisplay trifft auf ein kompaktes 5,4-Zoll-Außendisplay, geschützt von einem neuartigen Grade-5-Titanscharnier ohne sichtbaren Knick."
                      : "Apple's first foldable masterpiece. A seamless 7.6-inch inner OLED canvas meets a compact 5.4-inch outer cover screen, engineered with a zero-gap titanium hinge."
                    : isDe
                    ? "Der neue Maßstab in der mobilen Bild- und Videoverarbeitung. Mechanisch variable Blende (f/1.48 bis f/4.0), 12 GB LPDDR5X Arbeitsspeicher und unübertroffene Effizienz durch TSMCs 2nm-Verfahren."
                    : "The definitive creative instrument. Physical mechanical variable aperture (f/1.48 to f/4.0), 12GB LPDDR5X unified memory, and unmatched efficiency via TSMC's 2nm node."}
                </p>
              </div>

              {/* Technical Metrics Quartet */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5">
                  <div className="text-xs text-muted uppercase tracking-wider">{isDe ? "Architektur" : "Architecture"}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">2 nm A20 Pro</div>
                  <div className="text-[11px] text-muted">6-Core CPU &amp; GPU</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5">
                  <div className="text-xs text-muted uppercase tracking-wider">{isDe ? "Optik" : "Optics"}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">48 MP Variable</div>
                  <div className="text-[11px] text-muted">f/1.48 – f/4.0 mechanisch</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5">
                  <div className="text-xs text-muted uppercase tracking-wider">{isDe ? "Speicher" : "Memory"}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">12 GB RAM</div>
                  <div className="text-[11px] text-muted">Bis zu 2 TB NVMe</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-surface/50 p-3.5">
                  <div className="text-xs text-muted uppercase tracking-wider">{isDe ? "Laden" : "Charging"}</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">45W / 25W</div>
                  <div className="text-[11px] text-muted">USB-PD &amp; Qi2 MagSafe</div>
                </div>
              </div>

              {/* Concierge Quotation Module */}
              <div className="rounded-2xl border border-border bg-surface/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <div className="text-[11px] font-semibold text-gold uppercase tracking-wider">
                      {isDe ? "Status & Reservierung" : "Status & Reservation"}
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {isDe ? "Vorbestellung & Quotation" : "Pre-order & Quotation"}
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
                  : "Trade in your current iPhone (e.g. iPhone 14, 15, 16, or 17). The certified trade-in value is deducted directly from the purchase price of your new device."}
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
                {isDe ? "Versicherter DHL Expressversand" : "Insured Express Dispatch"}
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
                  ? "Die weltweite Vorstellung fand im September 2026 statt. Reservierungen und individuelle Preisanfragen bei Apfel Park sind ab sofort aktiv. Die ersten Auslieferungen des iPhone 18 Pro und Pro Max erfolgen zeitnah, gefolgt vom iPhone Duo (Foldable) im Herbst 2026."
                  : "Following the September 2026 announcement, priority pre-order requests are open at Apfel Park. First dispatches of iPhone 18 Pro and Pro Max commence shortly, followed by the foldable iPhone Duo in autumn 2026."}
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
