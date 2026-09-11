"use client";

import { useState } from "react";
import Link from "next/link";
import { APPLE_MEDIA } from "@/components/banner/apple-media";
import { siteInfo } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

export type ModelId = "pro" | "promax" | "duo";

interface IPhone18ShowcaseProps {
  locale: Locale;
  initialModel?: ModelId;
}

export default function IPhone18Showcase({ locale, initialModel = "pro" }: IPhone18ShowcaseProps) {
  const isDe = locale === "de";
  const [selectedModel, setSelectedModel] = useState<ModelId>(initialModel);
  const [activeMediaTab, setActiveMediaTab] = useState<"lineup" | "frontback" | "duoNight" | "duoWhite" | "video">(
    initialModel === "duo" ? "video" : "lineup"
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // WhatsApp & Email prefilled links
  const waTextDe = encodeURIComponent(
    `Hallo Apfel Park Team, ich interessiere mich für das ${
      selectedModel === "pro"
        ? "iPhone 18 Pro"
        : selectedModel === "promax"
        ? "iPhone 18 Pro Max"
        : "iPhone Duo (Foldable)"
    }. Bitte senden Sie mir ein unverbindliches Angebot / Informationen zur Vorbestellung.`
  );
  const waTextEn = encodeURIComponent(
    `Hello Apfel Park Team, I am interested in the ${
      selectedModel === "pro"
        ? "iPhone 18 Pro"
        : selectedModel === "promax"
        ? "iPhone 18 Pro Max"
        : "iPhone Duo (Foldable)"
    }. Please send me a quote and pre-order details.`
  );
  const whatsappUrl = `https://wa.me/${siteInfo.whatsapp}?text=${isDe ? waTextDe : waTextEn}`;

  const emailSubject = encodeURIComponent(
    isDe
      ? `Anfrage & Angebot: Apple ${
          selectedModel === "pro" ? "iPhone 18 Pro" : selectedModel === "promax" ? "iPhone 18 Pro Max" : "iPhone Duo"
        }`
      : `Inquiry & Quote: Apple ${
          selectedModel === "pro" ? "iPhone 18 Pro" : selectedModel === "promax" ? "iPhone 18 Pro Max" : "iPhone Duo"
        }`
  );
  const emailUrl = `mailto:${siteInfo.email}?subject=${emailSubject}`;

  // GSMArena accurate specifications
  const specs = [
    {
      category: isDe ? "Display & Bildschirm" : "Display & Screen",
      pro: isDe
        ? "6.3\" Super Retina XDR OLED (2622 × 1206, 460 ppi), 120Hz ProMotion, Always-On, 3.000 Nits Peak"
        : "6.3\" Super Retina XDR OLED (2622 × 1206, 460 ppi), 120Hz ProMotion, Always-On, 3,000 Nits Peak",
      promax: isDe
        ? "6.9\" Super Retina XDR OLED (2868 × 1320, 460 ppi), 120Hz ProMotion, Always-On, 3.000 Nits Peak"
        : "6.9\" Super Retina XDR OLED (2868 × 1320, 460 ppi), 120Hz ProMotion, Always-On, 3,000 Nits Peak",
      duo: isDe
        ? "7.6\" Foldable LTPO OLED (Innen) + 5.4\" Super Retina Cover (Außen), 120Hz, Nano-Texture Antireflexion"
        : "7.6\" Foldable LTPO OLED (Inner) + 5.4\" Super Retina Cover (Outer), 120Hz, Anti-Crease Nano-Texture",
    },
    {
      category: isDe ? "Prozessor & KI" : "Processor & AI",
      pro: isDe ? "Apple A20 Pro (TSMC 2nm), 6-Core CPU, 6-Core GPU, 16-Core Neural Engine" : "Apple A20 Pro (TSMC 2nm), 6-Core CPU, 6-Core GPU, 16-Core Neural Engine",
      promax: isDe ? "Apple A20 Pro (TSMC 2nm), 6-Core CPU, 6-Core GPU, 16-Core Neural Engine" : "Apple A20 Pro (TSMC 2nm), 6-Core CPU, 6-Core GPU, 16-Core Neural Engine",
      duo: isDe ? "Apple A20 Pro (TSMC 2nm) mit Dual-Screen Multitasking Engine" : "Apple A20 Pro (TSMC 2nm) with Dual-Screen Multitasking Engine",
    },
    {
      category: isDe ? "Arbeitsspeicher & Speicher" : "RAM & Storage",
      pro: "12 GB LPDDR5X · 256GB / 512GB / 1TB / 2TB NVMe",
      promax: "12 GB LPDDR5X · 256GB / 512GB / 1TB / 2TB NVMe",
      duo: "12 GB LPDDR5X · 256GB / 512GB / 1TB / 2TB NVMe",
    },
    {
      category: isDe ? "Kamerasystem" : "Camera System",
      pro: isDe
        ? "48 MP Pro Fusion (f/1.48–f/4.0 variable Blende, Sensor-Shift OIS) + 48 MP Ultraweit + 48 MP 5x Tetraprism Tele"
        : "48 MP Pro Fusion (f/1.48–f/4.0 variable aperture, Sensor-Shift OIS) + 48 MP Ultra-Wide + 48 MP 5x Tetraprism Tele",
      promax: isDe
        ? "48 MP Pro Fusion (f/1.48–f/4.0 variable Blende, Sensor-Shift OIS) + 48 MP Ultraweit + 48 MP 5x Tetraprism Tele (10x verlustfrei)"
        : "48 MP Pro Fusion (f/1.48–f/4.0 variable aperture, Sensor-Shift OIS) + 48 MP Ultra-Wide + 48 MP 5x Tetraprism Tele (10x lossless)",
      duo: isDe
        ? "Duales 48 MP System (48 MP Hauptkamera + 48 MP Ultraweit) + 12 MP Under-Display Frontkamera"
        : "Dual 48 MP System (48 MP Main + 48 MP Ultra-Wide) + 12 MP Under-Display Front Camera",
    },
    {
      category: isDe ? "Akku & Schnellladen" : "Battery & Charging",
      pro: isDe
        ? "4.288 mAh, 45W kabelgebunden (50% in 20 Min), 25W MagSafe Qi2"
        : "4,288 mAh, 45W wired fast charging (50% in 20 min), 25W MagSafe Qi2",
      promax: isDe
        ? "5.567 mAh (bis zu 35 Std. Videowiedergabe), 45W kabelgebunden, 25W MagSafe Qi2"
        : "5,567 mAh (up to 35 hrs video playback), 45W wired, 25W MagSafe Qi2",
      duo: isDe
        ? "5.400 mAh Dual-Zellen-Akku, 45W Schnellladung, 25W MagSafe Wireless"
        : "5,400 mAh Dual-Cell Battery, 45W Fast Charging, 25W MagSafe Wireless",
    },
    {
      category: isDe ? "Gehäuse & Material" : "Build & Materials",
      pro: isDe
        ? "Titan Grade 5 mit Mikro-Finish, Ceramic Shield 2 Front, IP68 (6m für 30 Min)"
        : "Grade 5 Titanium micro-blasted, Ceramic Shield 2 front, IP68 water resistant",
      promax: isDe
        ? "Titan Grade 5 mit Mikro-Finish, Ceramic Shield 2 Front, IP68 (6m für 30 Min)"
        : "Grade 5 Titanium micro-blasted, Ceramic Shield 2 front, IP68 water resistant",
      duo: isDe
        ? "Titan Grade 5 Scharnier (Zero-Gap Hinge), 5.2 mm entfaltet / 11.3 mm geschlossen, 254g, IP68"
        : "Grade 5 Titanium Zero-Gap Hinge, 5.2 mm unfolded / 11.3 mm folded, 254g, IP68",
    },
    {
      category: isDe ? "Konnektivität & Sicherheit" : "Connectivity & Security",
      pro: "Wi-Fi 7, Bluetooth 6.0, 5G Apple C2 Modem, Ultra-Wideband 2, Face ID",
      promax: "Wi-Fi 7, Bluetooth 6.0, 5G Apple C2 Modem, Ultra-Wideband 2, Face ID",
      duo: "Wi-Fi 7, Bluetooth 6.0, 5G Apple C2 Modem, Thread, Seitliches Touch ID im Power-Button",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Breadcrumb & Status */}
      <div className="border-b border-border/60 bg-surface/50 py-3">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 text-xs">
          <nav className="flex items-center gap-2 text-muted" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-gold transition-colors">
              {isDe ? "Startseite" : "Home"}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/store`} className="hover:text-gold transition-colors">
              {isDe ? "Shop" : "Store"}
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">iPhone 18 & Duo</span>
          </nav>

          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex h-2 w-2 rounded-full bg-green animate-pulse" />
            <span className="text-muted">
              {isDe ? "Vorbestellung & Angebote Hamburg eröffnet" : "Pre-orders & Quotes Hamburg Open"}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Header Section */}
      <header className="relative overflow-hidden border-b border-border/80 bg-gradient-to-b from-surface to-background py-12 md:py-16">
        <div className="absolute left-1/2 top-0 h-[450px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
        <div className="container-page relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold">
              <span>✨</span>
              <span>{isDe ? "Offizielle Apple Keynote Enthüllung 2026" : "Official Apple Keynote Reveal 2026"}</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-balance">
              {isDe ? (
                <>
                  Apple iPhone 18 Pro, Pro Max <br className="hidden sm:inline" />
                  <span className="text-gold">&amp; das neue iPhone Duo</span>
                </>
              ) : (
                <>
                  Apple iPhone 18 Pro, Pro Max <br className="hidden sm:inline" />
                  <span className="text-gold">&amp; The All-New iPhone Duo</span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted text-balance">
              {isDe
                ? "Das nächste Kapitel der Spitzenklasse. Angetrieben vom revolutionären A20 Pro Chip in 2-Nanometer-Architektur, variabler 48-MP-Pro-Fusion-Optik und Apples erstem Foldable-Meisterwerk."
                : "The pinnacle of mobile engineering. Powered by the groundbreaking 2nm Apple A20 Pro silicon, variable-aperture 48MP Pro Fusion optics, and Apple\x27s first foldable masterpiece."}
            </p>

            {/* Direct Quotation CTA Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-[#25D366]/20 transition-all hover:scale-105 hover:bg-[#20ba5a]"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.818-.981z" />
                </svg>
                <span>{isDe ? "Angebot via WhatsApp anfragen" : "Get Instant Quote on WhatsApp"}</span>
              </a>

              <a
                href={emailUrl}
                className="inline-flex items-center gap-2.5 rounded-full border border-gold/40 bg-surface px-6 py-3.5 text-sm font-bold text-foreground shadow-md transition-all hover:border-gold hover:bg-gold/10"
              >
                <svg className="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{isDe ? "Per E-Mail anfragen" : "Request Email Quote"}</span>
              </a>

              <Link
                href={`/${locale}/repairs`}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-muted hover:text-foreground transition-colors"
              >
                <span>{isDe ? "Altgerät in Zahlung geben" : "Trade-in your old device"}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Model Selection Tabs */}
      <section className="sticky top-14 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md py-3">
        <div className="container-page flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedModel("pro");
              setActiveMediaTab("lineup");
            }}
            className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
              selectedModel === "pro"
                ? "bg-gold text-black shadow-md shadow-gold/20 scale-105"
                : "bg-surface border border-border text-muted hover:text-foreground hover:border-gold/40"
            }`}
          >
            iPhone 18 Pro (6.3&quot;)
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedModel("promax");
              setActiveMediaTab("frontback");
            }}
            className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
              selectedModel === "promax"
                ? "bg-gold text-black shadow-md shadow-gold/20 scale-105"
                : "bg-surface border border-border text-muted hover:text-foreground hover:border-gold/40"
            }`}
          >
            iPhone 18 Pro Max (6.9&quot;)
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedModel("duo");
              setActiveMediaTab("video");
            }}
            className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
              selectedModel === "duo"
                ? "bg-gold text-black shadow-md shadow-gold/20 scale-105"
                : "bg-surface border border-border text-muted hover:text-foreground hover:border-gold/40"
            }`}
          >
            ✨ iPhone Duo (Foldable)
          </button>
        </div>
      </section>

      {/* Interactive Media Showcase & Gallery */}
      <section className="py-10 md:py-16 border-b border-border/60">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {/* Visual Display Stage */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-surface/80 via-surface to-surface/40 p-6 md:p-10 shadow-2xl overflow-hidden backdrop-blur-xl group">
                <div className="absolute inset-0 bg-radial-gold opacity-10 pointer-events-none" />

                {/* Media Switcher Badges */}
                <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("lineup")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      activeMediaTab === "lineup"
                        ? "bg-gold text-black"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    {isDe ? "18 Pro Farbübersicht" : "18 Pro Colors"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("frontback")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      activeMediaTab === "frontback"
                        ? "bg-gold text-black"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    {isDe ? "Pro Vorn & Hinten" : "Pro Front & Back"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("duoNight")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      activeMediaTab === "duoNight"
                        ? "bg-gold text-black"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    {isDe ? "Duo Dunkel" : "Duo Dark"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("duoWhite")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      activeMediaTab === "duoWhite"
                        ? "bg-gold text-black"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    {isDe ? "Duo Hell" : "Duo Light"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("video")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      activeMediaTab === "video"
                        ? "bg-gold text-black"
                        : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                  >
                    🎬 {isDe ? "4K Film" : "4K Film"}
                  </button>
                </div>

                {/* Media Container */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full flex items-center justify-center pt-8">
                  {activeMediaTab === "lineup" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={APPLE_MEDIA.proLineup}
                      alt="iPhone 18 Pro Lineup Finishes"
                      className="max-h-full max-w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-105"
                    />
                  )}
                  {activeMediaTab === "frontback" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={APPLE_MEDIA.proFrontBack}
                      alt="iPhone 18 Pro Front and Back View"
                      className="max-h-full max-w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-105"
                    />
                  )}
                  {activeMediaTab === "duoNight" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={APPLE_MEDIA.duoNight}
                      alt="iPhone Duo Foldable Night Sky"
                      className="max-h-full max-w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-105"
                    />
                  )}
                  {activeMediaTab === "duoWhite" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={APPLE_MEDIA.duoWhite}
                      alt="iPhone Duo Foldable Star White"
                      className="max-h-full max-w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:scale-105"
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
                      className="max-h-full max-w-full rounded-2xl shadow-2xl"
                    />
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span>✨ {isDe ? "Originale hochauflösende Apple Media Vorschau" : "High-Resolution Apple Media Showcase"}</span>
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="font-semibold text-gold hover:underline flex items-center gap-1"
                  >
                    <span>⤢</span>
                    <span>{isDe ? "Vollbild öffnen" : "Open Fullscreen"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Summary & Pre-Order Box */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-gold">
                  {selectedModel === "duo"
                    ? isDe ? "Die Foldable Revolution" : "The Foldable Revolution"
                    : isDe ? "Pro Flagship Performance" : "Pro Flagship Performance"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {selectedModel === "pro" && "iPhone 18 Pro (6.3\")"}
                  {selectedModel === "promax" && "iPhone 18 Pro Max (6.9\")"}
                  {selectedModel === "duo" && "iPhone Duo Foldable (7.6\" & 5.4\")"}
                </h2>
                <p className="text-sm sm:text-base text-muted">
                  {selectedModel === "duo"
                    ? isDe
                      ? "Apples erstes faltbares Smartphone mit nahtlosem 7.6-Zoll-Innenbildschirm, ultrakompaktem 5.4-Zoll-Außendisplay und der vollen Power des A20 Pro 2nm-Chips."
                      : "Apple\x27s first foldable device combining a seamless 7.6-inch inner canvas with a compact 5.4-inch cover screen, powered by the 2nm A20 Pro silicon."
                    : isDe
                    ? "Der neue Maßstab für Kreative und Profis: Variable Kamerablende (f/1.48–f/4.0), bis zu 2 TB Speicher, 12 GB RAM und unerreichte 2nm-Energieeffizienz."
                    : "The definitive creative powerhouse: Variable camera aperture (f/1.48–f/4.0), up to 2TB storage, 12GB RAM and 2nm architecture."}
                </p>
              </div>

              {/* Highlights Bullet List */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-border/70 bg-surface/60 p-3 text-center">
                  <div className="text-lg font-extrabold text-gold">A20 Pro</div>
                  <div className="text-xs text-muted">{isDe ? "2nm High-End Chip" : "2nm Silicon"}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-surface/60 p-3 text-center">
                  <div className="text-lg font-extrabold text-gold">48 MP</div>
                  <div className="text-xs text-muted">{isDe ? "Variable Blende" : "Variable Aperture"}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-surface/60 p-3 text-center">
                  <div className="text-lg font-extrabold text-gold">12 GB</div>
                  <div className="text-xs text-muted">{isDe ? "LPDDR5X RAM" : "Unified Memory"}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-surface/60 p-3 text-center">
                  <div className="text-lg font-extrabold text-gold">45W / 25W</div>
                  <div className="text-xs text-muted">{isDe ? "Schnellladen & MagSafe" : "Fast & Qi2 MagSafe"}</div>
                </div>
              </div>

              {/* Action Box */}
              <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-surface to-surface p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gold">{isDe ? "Preise & Verfügbarkeit" : "Pricing & Availability"}</div>
                    <div className="text-xl font-bold text-foreground">
                      {isDe ? "Auf Anfrage / Vorbestellbar" : "On Request / Pre-orderable"}
                    </div>
                  </div>
                  <span className="rounded-full bg-green/20 px-3 py-1 text-xs font-bold text-green">
                    {isDe ? "Hamburg Store & Versand" : "Hamburg Store & Delivery"}
                  </span>
                </div>

                <p className="text-xs text-muted">
                  {isDe
                    ? "Erhalte innerhalb kürzester Zeit ein verbindliches Angebot mit tagesaktuellem Bestpreis für dein Wunschmodell."
                    : "Receive a binding quotation with the best daily market price for your desired configuration within minutes."}
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-black transition-all hover:bg-[#20ba5a]"
                  >
                    💬 {isDe ? "WhatsApp Angebot" : "WhatsApp Quote"}
                  </a>
                  <a
                    href={emailUrl}
                    className="flex-1 text-center rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-gold"
                  >
                    ✉️ {isDe ? "E-Mail Anfrage" : "Email Inquiry"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive GSMArena Technical Specifications Matrix */}
      <section className="py-12 md:py-20 bg-surface/30 border-b border-border/60">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              {isDe ? "Detaillierter Hardware-Vergleich" : "Detailed Hardware Comparison"}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground">
              {isDe ? "Technische Daten im Überblick" : "Technical Specifications Overview"}
            </h2>
            <p className="text-sm sm:text-base text-muted">
              {isDe
                ? "Vollständige Gegenüberstellung der 2026er Apple Flaggschiffe basierend auf verifizierten GSMArena Spezifikationen."
                : "Full comparison matrix of the 2026 Apple flagship lineup based on verified GSMArena technical data."}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-strong/80 text-xs uppercase tracking-wider text-muted">
                  <th className="p-4 sm:p-5 font-bold">{isDe ? "Kategorie" : "Category"}</th>
                  <th className={`p-4 sm:p-5 font-bold ${selectedModel === "pro" ? "text-gold bg-gold/5" : ""}`}>
                    iPhone 18 Pro
                  </th>
                  <th className={`p-4 sm:p-5 font-bold ${selectedModel === "promax" ? "text-gold bg-gold/5" : ""}`}>
                    iPhone 18 Pro Max
                  </th>
                  <th className={`p-4 sm:p-5 font-bold ${selectedModel === "duo" ? "text-gold bg-gold/5" : ""}`}>
                    iPhone Duo (Foldable)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {specs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-strong/40 transition-colors">
                    <td className="p-4 sm:p-5 font-semibold text-foreground whitespace-nowrap align-top">
                      {row.category}
                    </td>
                    <td className={`p-4 sm:p-5 text-muted align-top ${selectedModel === "pro" ? "bg-gold/5 font-medium text-foreground" : ""}`}>
                      {row.pro}
                    </td>
                    <td className={`p-4 sm:p-5 text-muted align-top ${selectedModel === "promax" ? "bg-gold/5 font-medium text-foreground" : ""}`}>
                      {row.promax}
                    </td>
                    <td className={`p-4 sm:p-5 text-muted align-top ${selectedModel === "duo" ? "bg-gold/5 font-medium text-foreground" : ""}`}>
                      {row.duo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Services & Trade-In Section */}
      <section className="py-12 md:py-16 border-b border-border/60">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="text-2xl">🔄</div>
              <h3 className="text-lg font-bold text-foreground">
                {isDe ? "Trade-In & Altgeräte-Ankauf" : "Trade-In & Buyback Bonus"}
              </h3>
              <p className="text-xs sm:text-sm text-muted">
                {isDe
                  ? "Gib dein bisheriges iPhone (z.B. iPhone 14, 15, 16 oder 17) in Zahlung und sichere dir einen Sofort-Rabatt auf dein neues iPhone 18 Pro oder Duo."
                  : "Trade in your previous iPhone model (iPhone 14, 15, 16, or 17) and apply its value directly towards your new iPhone 18 Pro or Duo."}
              </p>
              <Link href={`/${locale}/repairs`} className="inline-block text-xs font-bold text-gold hover:underline">
                {isDe ? "Ankaufswert schätzen lassen →" : "Estimate trade-in value →"}
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="text-2xl">🏪</div>
              <h3 className="text-lg font-bold text-foreground">
                {isDe ? "Store Abholung in Hamburg" : "Store Pickup in Hamburg"}
              </h3>
              <p className="text-xs sm:text-sm text-muted">
                {isDe
                  ? `Besuche uns direkt vor Ort in Hamburg-Wilhelmsburg (${siteInfo.address.street}). Geräteprüfung, Datenübertragung und persönliche Beratung inklusive.`
                  : `Visit us in person in Hamburg-Wilhelmsburg (${siteInfo.address.street}). Includes device inspection, data transfer and expert advice.`}
              </p>
              <div className="text-xs text-muted font-medium">
                {isDe ? "Mo – Sa: 09:30 – 20:00 Uhr" : "Mon – Sat: 09:30 – 20:00"}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="text-2xl">📦</div>
              <h3 className="text-lg font-bold text-foreground">
                {isDe ? "Versicherter DHL Versand" : "Insured Nationwide Shipping"}
              </h3>
              <p className="text-xs sm:text-sm text-muted">
                {isDe
                  ? "Schneller und voll versicherter Versand innerhalb ganz Deutschlands. Sendungsverfolgung und sichere Zahlungsabwicklung garantiert."
                  : "Fast, fully insured shipping throughout Germany with real-time DHL tracking and verified payment protection."}
              </p>
              <span className="inline-block text-xs font-semibold text-green">
                ✓ {isDe ? "Voller Käuferschutz & Garantie" : "Full Buyer Protection & Warranty"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SEO FAQ Section */}
      <section className="py-12 md:py-20 bg-surface/20">
        <div className="container-page max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">FAQ</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {isDe ? "Häufig gestellte Fragen (FAQ)" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-4">
            <details className="group rounded-2xl border border-border bg-surface p-5 transition-all open:border-gold/50">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground list-none">
                <span>{isDe ? "Wann sind iPhone 18 Pro und iPhone Duo erhältlich?" : "When are iPhone 18 Pro and iPhone Duo available?"}</span>
                <span className="text-gold transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {isDe
                  ? "Das iPhone 18 Pro und Pro Max wurden am 9. September 2026 vorgestellt. Vorbestellungen und Reservierungsanfragen bei Apfel Park sind ab sofort möglich. Das revolutionäre iPhone Duo (Foldable) erscheint ab Ende Oktober 2026."
                  : "The iPhone 18 Pro and Pro Max were announced on September 9, 2026. Pre-orders and quote requests at Apfel Park are open now. The foldable iPhone Duo will be released starting late October 2026."}
              </p>
            </details>

            <details className="group rounded-2xl border border-border bg-surface p-5 transition-all open:border-gold/50">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground list-none">
                <span>{isDe ? "Wie kann ich ein individuelles Angebot anfordern?" : "How can I request a personal quotation?"}</span>
                <span className="text-gold transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {isDe
                  ? "Klicke einfach auf den WhatsApp-Button oder schreibe uns eine E-Mail an info@apfel-park.de mit deiner gewünschten Modell- und Speichervariante. Wir antworten innerhalb kürzester Zeit mit einem transparenten Angebot."
                  : "Simply click the WhatsApp button or email us at info@apfel-park.de stating your preferred model, color, and storage. We will reply promptly with a transparent quote."}
              </p>
            </details>

            <details className="group rounded-2xl border border-border bg-surface p-5 transition-all open:border-gold/50">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground list-none">
                <span>{isDe ? "Sind die Geräte ohne Vertrag (SIM-Lock frei)?" : "Are the devices contract-free and SIM-unlocked?"}</span>
                <span className="text-gold transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {isDe
                  ? "Ja, alle bei Apfel Park angebotenen Geräte sind vertragsfrei (ohne SIM-Lock) und können mit jeder beliebigen SIM-Karte oder eSIM weltweit genutzt werden."
                  : "Yes, all devices provided by Apfel Park are 100% factory unlocked without contract ties and support any physical SIM or eSIM globally."}
              </p>
            </details>

            <details className="group rounded-2xl border border-border bg-surface p-5 transition-all open:border-gold/50">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-foreground list-none">
                <span>{isDe ? "Kann ich mein altes Smartphone in Zahlung geben?" : "Can I trade in my current smartphone?"}</span>
                <span className="text-gold transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {isDe
                  ? "Ja, wir bieten eine direkte Inzahlungnahme deines Altgeräts an. Der Ankaufswert wird direkt vom Kaufpreis deines neuen iPhones abgezogen."
                  : "Yes, we provide direct device trade-ins. The assessed value of your existing phone will be deducted directly from your new iPhone order."}
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/20"
            >
              ✕ {isDe ? "Schließen" : "Close"}
            </button>
            {activeMediaTab === "lineup" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={APPLE_MEDIA.proLineup} alt="Lineup" className="max-h-[80vh] object-contain" />
            )}
            {activeMediaTab === "frontback" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={APPLE_MEDIA.proFrontBack} alt="Front and Back" className="max-h-[80vh] object-contain" />
            )}
            {activeMediaTab === "duoNight" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={APPLE_MEDIA.duoNight} alt="Duo Night" className="max-h-[80vh] object-contain" />
            )}
            {activeMediaTab === "duoWhite" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={APPLE_MEDIA.duoWhite} alt="Duo White" className="max-h-[80vh] object-contain" />
            )}
            {activeMediaTab === "video" && (
              <video src={APPLE_MEDIA.duoVideo} controls autoPlay className="max-h-[80vh] rounded-xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
