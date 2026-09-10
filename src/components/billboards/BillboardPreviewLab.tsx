"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type Locale } from "@/lib/i18n";

export type DeviceModelInfo = {
  id: string;
  brand: string;
  name: string;
  badge: { de: string; en: string };
  tagline: { de: string; en: string };
  priceTag: string;
  originalPrice: string;
  savings: string;
  theme: "burgundy" | "glacier" | "gold" | "violet" | "mint" | "obsidian";
  image: string;
  imageAlt: string;
  youtubeId?: string;
  videoTitle?: string;
  specs: Array<{ label: { de: string; en: string }; value: { de: string; en: string } }>;
  features: Array<{ icon: string; title: { de: string; en: string }; desc: { de: string; en: string } }>;
  ctaPrimary: { de: string; en: string; href: string };
  ctaSecondary: { de: string; en: string; href: string };
};

export const SHOWCASE_DEVICES: DeviceModelInfo[] = [
  {
    id: "iphone-duo",
    brand: "Apple",
    name: "iPhone Duo (Foldable)",
    badge: {
      de: "✨ Weltpremiere · Apples Erstes Foldable",
      en: "✨ World Premiere · Apple's First Foldable",
    },
    tagline: {
      de: "5.4\" Kompakt-Display geschlossen · Entfaltet zu 7.6\" Ultra-Workspace · A20 Pro 2nm Chip · 48 MP Dual Fusion Kamera · Titan-Design",
      en: "5.4\" Compact Display closed · Unfolds to 7.6\" Ultra Workspace · A20 Pro 2nm Chip · 48 MP Dual Fusion Camera · Titanium Design",
    },
    priceTag: "ab 1.999 €",
    originalPrice: "UVP 2.199 €",
    savings: "Exklusiv vorbestellbar",
    theme: "burgundy",
    image: "/images/shop2.jpg",
    imageAlt: "Apple iPhone Duo Foldable",
    youtubeId: "dQw4w9WgXcQ", // Placeholder for official keynote video
    videoTitle: "Apple iPhone Duo – Official Reveal & Feature Tour",
    specs: [
      { label: { de: "Hauptdisplay", en: "Main Display" }, value: { de: "7.6\" Foldable OLED, 120Hz ProMotion, 3.000 Nits", en: "7.6\" Foldable OLED, 120Hz ProMotion, 3,000 Nits" } },
      { label: { de: "Außendisplay", en: "Cover Display" }, value: { de: "5.4\" Super Retina XDR OLED (Einhandbedienung)", en: "5.4\" Super Retina XDR OLED (One-handed use)" } },
      { label: { de: "Prozessor", en: "Processor" }, value: { de: "Apple A20 Pro (2nm Architektur mit Dual-NPU)", en: "Apple A20 Pro (2nm Architecture with Dual NPU)" } },
      { label: { de: "Kamera", en: "Camera" }, value: { de: "48 MP Dual Fusion mit Dual-Screen Suchervorschau", en: "48 MP Dual Fusion with Dual-Screen Viewfinder" } },
      { label: { de: "Gehäuse & Schutz", en: "Build & Glass" }, value: { de: "Grad 5 Titanrahmen, Ultra Thin Glass & Ceramic Shield", en: "Grade 5 Titanium, Ultra Thin Glass & Ceramic Shield" } },
      { label: { de: "Speichervarianten", en: "Storage" }, value: { de: "512 GB / 1 TB / 2 TB", en: "512 GB / 1 TB / 2 TB" } },
      { label: { de: "Farben", en: "Colors" }, value: { de: "Titan Burgunderrot, Titan Natur, Glacier Blau, Space Schwarz", en: "Titanium Burgundy, Natural Titanium, Glacier Blue, Space Black" } },
    ],
    features: [
      { icon: "📱", title: { de: "Dual-Display Multitasking", en: "Dual-Display Multitasking" }, desc: { de: "Nahtloser Wechsel von 5.4\" zu 7.6\" mit zwei parallelen Apps.", en: "Seamless continuity from 5.4\" to 7.6\" with split apps." } },
      { icon: "⚡", title: { de: "A20 Pro (2nm) Power", en: "A20 Pro (2nm) Power" }, desc: { de: "Höchste Effizienz mit Dual-Akku-Architektur für 30h+ Laufzeit.", en: "Unmatched 2nm efficiency with dual-battery for 30h+ runtime." } },
      { icon: "🧠", title: { de: "Apple Intelligence Pro", en: "Apple Intelligence Pro" }, desc: { de: "Tief integrierte On-Device Siri AI und visuelle Live-Assistenz.", en: "Deep on-device Siri AI and live visual intelligence." } },
      { icon: "🛡️", title: { de: "12 Monate Garantie", en: "12-Month Warranty" }, desc: { de: "Volle Apfel Park Händlergarantie & Sofort-Service in Hamburg.", en: "Full Apfel Park dealer warranty & local service in Hamburg." } },
    ],
    ctaPrimary: { de: "Jetzt vorbestellen", en: "Pre-order now", href: "#" },
    ctaSecondary: { de: "Technische Daten ansehen", en: "View full specs", href: "#specs" },
  },
  {
    id: "iphone-18-pro-max",
    brand: "Apple",
    name: "iPhone 18 Pro Max",
    badge: {
      de: "🚀 Das Ultimative Pro Flagship",
      en: "🚀 The Ultimate Pro Flagship",
    },
    tagline: {
      de: "48 MP Fusion Kamera mit variabler Blende (f/1.5–f/4.0) · A20 Pro 2nm Chip mit Vapor Chamber · Längste Akkulaufzeit aller Zeiten",
      en: "48 MP Fusion Camera with Variable Aperture (f/1.5–f/4.0) · A20 Pro 2nm Chip with Vapor Chamber · Longest iPhone Battery Ever",
    },
    priceTag: "ab 1.299 €",
    originalPrice: "UVP 1.449 €",
    savings: "Jetzt bis zu 150 € sparen",
    theme: "burgundy",
    image: "/images/shop2.jpg",
    imageAlt: "Apple iPhone 18 Pro Max",
    youtubeId: "dQw4w9WgXcQ",
    videoTitle: "Apple iPhone 18 Pro & Pro Max – Official Film",
    specs: [
      { label: { de: "Display", en: "Display" }, value: { de: "6.9\" Super Retina XDR OLED, 120Hz ProMotion, 3.000 Nits", en: "6.9\" Super Retina XDR OLED, 120Hz ProMotion, 3,000 Nits" } },
      { label: { de: "Kamerasystem", en: "Camera System" }, value: { de: "48 MP Variable Blende (f/1.5–f/4.0) + 48 MP Ultraweit + 5x Tele", en: "48 MP Variable Aperture (f/1.5–f/4.0) + 48 MP Ultra-Wide + 5x Tele" } },
      { label: { de: "Prozessor", en: "Processor" }, value: { de: "Apple A20 Pro (2nm) mit Vapor Chamber Kühlung", en: "Apple A20 Pro (2nm) with Vapor Chamber Cooling" } },
      { label: { de: "Dynamic Island", en: "Dynamic Island" }, value: { de: "Kompakteres Design mit bis zu 3 Live-Aktivitäten gleichzeitig", en: "Refined compact footprint tracking 3 Live Activities simultaneously" } },
      { label: { de: "Speicher", en: "Storage" }, value: { de: "256 GB / 512 GB / 1 TB / 2 TB", en: "256 GB / 512 GB / 1 TB / 2 TB" } },
      { label: { de: "Farben", en: "Colors" }, value: { de: "Titan Burgunderrot, Titan Gletscherblau, Space Schwarz, Silber", en: "Titanium Burgundy, Glacier Blue, Space Black, Natural Silver" } },
    ],
    features: [
      { icon: "📸", title: { de: "Variable Blende f/1.5–f/4.0", en: "Variable Aperture f/1.5–f/4.0" }, desc: { de: "Mechanische Blendenanpassung für echtes Bokeh und Nachtschärfe.", en: "Mechanical aperture control for true optical bokeh and low-light clarity." } },
      { icon: "❄️", title: { de: "Vapor Chamber Kühlung", en: "Vapor Chamber Cooling" }, desc: { de: "Dauerhafte Höchstleistung bei Gaming, 4K 120fps Video und AI.", en: "Sustained peak performance during gaming, 4K 120fps and heavy AI tasks." } },
      { icon: "🔋", title: { de: "Rekord-Akkulaufzeit", en: "Record Battery Life" }, desc: { de: "Größter Batteriesprung in der iPhone-Geschichte (33h+ Videowiedergabe).", en: "Largest battery increase in iPhone history (33h+ video playback)." } },
      { icon: "📍", title: { de: "Abholung in Hamburg", en: "Pickup in Hamburg" }, desc: { de: "Sofort im Ladenlokal in Wilhelmsburg abholbereit oder 24h DHL.", en: "Available immediately in Hamburg store or 24h insured DHL shipping." } },
    ],
    ctaPrimary: { de: "iPhone 18 Pro Max ansehen", en: "Explore iPhone 18 Pro Max", href: "#" },
    ctaSecondary: { de: "Modelle vergleichen", en: "Compare models", href: "#" },
  },
  {
    id: "samsung-z-fold",
    brand: "Samsung",
    name: "Samsung Galaxy Z Fold Series",
    badge: {
      de: "🌌 Das Multitasking Kraftpaket",
      en: "🌌 The Multitasking Powerhouse",
    },
    tagline: {
      de: "7.6\" Dynamic AMOLED 2X 120Hz Falt-Display · Snapdragon 8 Gen for Galaxy · Galaxy AI 2.0 mit Dual-Screen Dolmetscher · S-Pen Unterstützung",
      en: "7.6\" Dynamic AMOLED 2X 120Hz Foldable Display · Snapdragon 8 Gen for Galaxy · Galaxy AI 2.0 with Dual-Screen Interpreter · S-Pen Support",
    },
    priceTag: "ab 1.499 €",
    originalPrice: "UVP 1.999 €",
    savings: "Spare 500 €",
    theme: "violet",
    image: "/images/shop2.jpg",
    imageAlt: "Samsung Galaxy Z Fold",
    youtubeId: "dQw4w9WgXcQ",
    videoTitle: "Samsung Galaxy Z Fold – Official Unpacked Film",
    specs: [
      { label: { de: "Hauptdisplay", en: "Main Display" }, value: { de: "7.6\" Dynamic AMOLED 2X, 120Hz, 2.600 Nits", en: "7.6\" Dynamic AMOLED 2X, 120Hz, 2,600 Nits" } },
      { label: { de: "Frontdisplay", en: "Cover Display" }, value: { de: "6.3\" Dynamic AMOLED 2X, 120Hz", en: "6.3\" Dynamic AMOLED 2X, 120Hz" } },
      { label: { de: "Prozessor", en: "Processor" }, value: { de: "Snapdragon 8 Gen for Galaxy (Ray Tracing)", en: "Snapdragon 8 Gen for Galaxy (Ray Tracing)" } },
      { label: { de: "Kamera", en: "Camera" }, value: { de: "50 MP ProVisual OIS + 12 MP Ultraweit + 10 MP 3x Tele", en: "50 MP ProVisual OIS + 12 MP Ultra-Wide + 10 MP 3x Tele" } },
      { label: { de: "Robustheit", en: "Durability" }, value: { de: "Armor Aluminum, Gorilla Glass Victus 2, IP48 Schutz", en: "Armor Aluminum, Gorilla Glass Victus 2, IP48 Water Resistance" } },
      { label: { de: "Farben", en: "Colors" }, value: { de: "Silver Shadow, Navy Blau, Crafted Black, Pink, White", en: "Silver Shadow, Navy Blue, Crafted Black, Pink, White" } },
    ],
    features: [
      { icon: "🌐", title: { de: "Dual-Screen Dolmetscher", en: "Dual-Screen Interpreter" }, desc: { de: "Live-Übersetzung auf Innen- und Außendisplay für weltweite Gespräche.", en: "Real-time translations shown on inner and outer screens simultaneously." } },
      { icon: "✍️", title: { de: "S-Pen & Note Assist", en: "S-Pen & Note Assist" }, desc: { de: "Notizen handschriftlich erfassen und per KI automatisch formatieren.", en: "Handwrite notes with precision and let AI summarize and organize." } },
      { icon: "🔍", title: { de: "Circle to Search", en: "Circle to Search" }, desc: { de: "Jedes Bild oder Video auf dem riesigen 7.6\" Display einkreisen und sofort finden.", en: "Circle anything on the 7.6\" canvas to search instantly with Google." } },
      { icon: "🛡️", title: { de: "Geprüfte Qualität & Garantie", en: "Certified Quality & Warranty" }, desc: { de: "Mit 12 Monaten Garantie und technischem Check bei Apfel Park.", en: "Includes 12 months warranty and complete hardware verification." } },
    ],
    ctaPrimary: { de: "Galaxy Z Fold entdecken", en: "Discover Galaxy Z Fold", href: "#" },
    ctaSecondary: { de: "Zubehör & Hüllen", en: "Accessories & Cases", href: "#" },
  },
  {
    id: "pixel-11-pro",
    brand: "Google",
    name: "Google Pixel 11 Pro Series",
    badge: {
      de: "🤖 Reine Google KI-Power",
      en: "🤖 Pure Google AI Power",
    },
    tagline: {
      de: "Google Tensor G Prozessor mit Gemini Nano On-Device KI · 6.8\" Super Actua Display mit 3.000 Nits · Triple Pro Kamera mit 30x Super-Res-Zoom",
      en: "Google Tensor G Processor with Gemini Nano On-Device AI · 6.8\" Super Actua 3,000 Nits Display · Triple Pro Camera with 30x Super Res Zoom",
    },
    priceTag: "ab 899 €",
    originalPrice: "UVP 1.199 €",
    savings: "Top Deal",
    theme: "mint",
    image: "/images/shop2.jpg",
    imageAlt: "Google Pixel 11 Pro",
    youtubeId: "dQw4w9WgXcQ",
    videoTitle: "Google Pixel 11 Pro – Built for Gemini Era",
    specs: [
      { label: { de: "Display", en: "Display" }, value: { de: "6.8\" Super Actua LTPO OLED (1–120Hz, 3.000 Nits)", en: "6.8\" Super Actua LTPO OLED (1–120Hz, 3,000 Nits)" } },
      { label: { de: "Prozessor", en: "Processor" }, value: { de: "Google Tensor G mit Titan M2 Sicherheits-Chip", en: "Google Tensor G with Titan M2 Security" } },
      { label: { de: "Kamera", en: "Camera" }, value: { de: "50 MP Hauptsensor + 48 MP Makro + 48 MP 5x Periskop Tele", en: "50 MP Main + 48 MP Macro + 48 MP 5x Periscope Tele" } },
      { label: { de: "Frontkamera", en: "Front Camera" }, value: { de: "42 MP Ultraweitwinkel mit 4K 60fps", en: "42 MP Ultra-Wide with 4K 60fps" } },
      { label: { de: "Software", en: "Software" }, value: { de: "7 Jahre garantierte Android OS & Sicherheits-Updates", en: "7 Years guaranteed Android OS & security updates" } },
      { label: { de: "Farben", en: "Colors" }, value: { de: "Obsidian Schwarz, Porcelain Weiß, Hazel Grau, Rose Quartz", en: "Obsidian, Porcelain, Hazel, Rose Quartz" } },
    ],
    features: [
      { icon: "✨", title: { de: "Gemini Nano Studio", en: "Gemini Nano Studio" }, desc: { de: "Bilder per Texteingabe generieren und Fotos nachträglich erweitern.", en: "Generate graphics and reimagine scenes right on your device." } },
      { icon: "👥", title: { de: "Add Me & Best Take", en: "Add Me & Best Take" }, desc: { de: "Keiner fehlt auf dem Gruppenfoto – KI fügt den Fotografen nahtlos ein.", en: "Never miss a group photo; AI seamlessly blends the photographer in." } },
      { icon: "🔭", title: { de: "30x Super-Res-Zoom", en: "30x Super Res Zoom" }, desc: { de: "Gestochen scharfe Teleaufnahmen auch aus weiter Entfernung.", en: "Crystal-clear telephoto shots even from extreme distances." } },
      { icon: "🛡️", title: { de: "7 Jahre Software-Support", en: "7 Years Software Support" }, desc: { de: "Zukunftssicher mit monatlichen Feature Drops und Schutz.", en: "Future-proof investment with continuous Feature Drops." } },
    ],
    ctaPrimary: { de: "Pixel 11 Pro ansehen", en: "View Pixel 11 Pro", href: "#" },
    ctaSecondary: { de: "Alle Google Handys", en: "All Google Phones", href: "#" },
  },
];

export default function BillboardPreviewLab({ lang }: { lang: Locale }) {
  const isDe = lang === "de";
  const [selectedDevice, setSelectedDevice] = useState<string>("iphone-duo");
  const [billboardVariation, setBillboardVariation] = useState<"cinematic" | "split" | "slim" | "trust">("cinematic");
  const [previewDeviceMode, setPreviewDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"billboards" | "specs" | "video">("billboards");

  const currentDevice = SHOWCASE_DEVICES.find((d) => d.id === selectedDevice) || SHOWCASE_DEVICES[0];

  // Theme styling helpers
  const getThemeClasses = (theme: DeviceModelInfo["theme"]) => {
    switch (theme) {
      case "burgundy":
        return {
          glow: "from-rose-600/25 via-amber-600/10 to-transparent",
          badge: "bg-rose-500/15 border-rose-500/30 text-rose-300 dark:text-rose-200",
          border: "border-rose-500/25",
          accentText: "text-rose-400 dark:text-rose-300",
          button: "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-900/30",
        };
      case "violet":
        return {
          glow: "from-purple-600/25 via-indigo-600/10 to-transparent",
          badge: "bg-purple-500/15 border-purple-500/30 text-purple-300 dark:text-purple-200",
          border: "border-purple-500/25",
          accentText: "text-purple-400 dark:text-purple-300",
          button: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30",
        };
      case "mint":
        return {
          glow: "from-emerald-600/25 via-teal-600/10 to-transparent",
          badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 dark:text-emerald-200",
          border: "border-emerald-500/25",
          accentText: "text-emerald-400 dark:text-emerald-300",
          button: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30",
        };
      default:
        return {
          glow: "from-amber-600/25 via-gold-600/10 to-transparent",
          badge: "bg-amber-500/15 border-amber-500/30 text-amber-300 dark:text-amber-200",
          border: "border-amber-500/25",
          accentText: "text-amber-400 dark:text-amber-300",
          button: "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold shadow-amber-900/30",
        };
    }
  };

  const themeStyle = getThemeClasses(currentDevice.theme);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Test Staging Header Bar */}
      <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              🛠️ Staging / Design Test Lab
            </span>
            <span className="text-xs text-muted hidden sm:inline">
              {isDe ? "Interaktive Vorschau vor Veröffentlichung" : "Interactive preview before going live"}
            </span>
          </div>

          {/* Device & Responsive Viewport Switcher */}
          <div className="flex items-center gap-2">
            <div className="bg-background-alt border border-border rounded-lg p-1 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewDeviceMode("desktop")}
                className={`px-2.5 py-1 rounded-md transition ${previewDeviceMode === "desktop" ? "bg-surface text-heading font-medium shadow-xs" : "text-muted hover:text-foreground"}`}
              >
                🖥️ Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDeviceMode("tablet")}
                className={`px-2.5 py-1 rounded-md transition ${previewDeviceMode === "tablet" ? "bg-surface text-heading font-medium shadow-xs" : "text-muted hover:text-foreground"}`}
              >
                📱 Tablet
              </button>
              <button
                type="button"
                onClick={() => setPreviewDeviceMode("mobile")}
                className={`px-2.5 py-1 rounded-md transition ${previewDeviceMode === "mobile" ? "bg-surface text-heading font-medium shadow-xs" : "text-muted hover:text-foreground"}`}
              >
                📲 Mobile
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* Device Selection Bar */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
              {isDe ? "Flagship Showcase & Billboard Studio" : "Flagship Showcase & Billboard Studio"}
            </h1>
            <span className="text-xs text-muted">
              {isDe ? "4 Flagship Serien verfügbar" : "4 Flagship Series Available"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SHOWCASE_DEVICES.map((device) => {
              const isSelected = device.id === selectedDevice;
              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => setSelectedDevice(device.id)}
                  className={`p-3.5 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? "bg-surface border-gold shadow-lg shadow-gold/10 ring-1 ring-gold"
                      : "bg-surface/50 border-border hover:border-border/80 hover:bg-surface"
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted">
                      {device.brand}
                    </span>
                    <h2 className="font-semibold text-sm text-heading mt-0.5 line-clamp-1">
                      {device.name}
                    </h2>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-gold">{device.priceTag}</span>
                    <span className="text-[10px] text-muted line-through">{device.originalPrice}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* View Mode Navigation (Billboards / Full Specs / Video) */}
        <div className="border-b border-border flex items-center gap-6 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("billboards")}
            className={`pb-3 border-b-2 font-medium transition ${
              activeTab === "billboards"
                ? "border-gold text-gold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            🎨 {isDe ? "Billboard Design-Variationen" : "Billboard Design Variations"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`pb-3 border-b-2 font-medium transition ${
              activeTab === "specs"
                ? "border-gold text-gold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            📋 {isDe ? "Technische Daten & Features" : "Technical Specs & Features"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("video")}
            className={`pb-3 border-b-2 font-medium transition ${
              activeTab === "video"
                ? "border-gold text-gold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            🎬 {isDe ? "Offizielle Video-Präsentation" : "Official Video Showcase"}
          </button>
        </div>

        {/* TAB 1: BILLBOARDS VARIATIONS */}
        {activeTab === "billboards" && (
          <div className="space-y-8">
            {/* Variation Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted mr-2">
                {isDe ? "Layout-Stil wählen:" : "Select Layout Style:"}
              </span>
              <button
                type="button"
                onClick={() => setBillboardVariation("cinematic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  billboardVariation === "cinematic"
                    ? "bg-gold/15 border-gold text-gold"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                1. 🌟 {isDe ? "Cinematic Hero (Homepage Oben)" : "Cinematic Hero (Home Top)"}
              </button>
              <button
                type="button"
                onClick={() => setBillboardVariation("split")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  billboardVariation === "split"
                    ? "bg-gold/15 border-gold text-gold"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                2. ⚡ {isDe ? "Split-Feature (Homepage Mitte)" : "Split-Feature (Home Mid)"}
              </button>
              <button
                type="button"
                onClick={() => setBillboardVariation("slim")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  billboardVariation === "slim"
                    ? "bg-gold/15 border-gold text-gold"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                3. 🛍️ {isDe ? "Slim Highlight (Store Oben)" : "Slim Highlight (Store Top)"}
              </button>
              <button
                type="button"
                onClick={() => setBillboardVariation("trust")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  billboardVariation === "trust"
                    ? "bg-gold/15 border-gold text-gold"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                4. 🛡️ {isDe ? "Trust & B-Ware (Store Mitte)" : "Trust & Deals (Store Mid)"}
              </button>
            </div>

            {/* BILLBOARD RENDER CONTAINER (Simulating responsive viewports) */}
            <div
              className={`mx-auto transition-all duration-300 ${
                previewDeviceMode === "mobile"
                  ? "max-w-[420px] shadow-2xl rounded-3xl p-3 border border-border bg-background-alt"
                  : previewDeviceMode === "tablet"
                    ? "max-w-[768px] shadow-xl rounded-2xl p-4 border border-border bg-background-alt"
                    : "w-full"
              }`}
            >
              {/* VARIATION 1: CINEMATIC HERO BILLBOARD */}
              {billboardVariation === "cinematic" && (
                <div className={`relative overflow-hidden rounded-3xl border ${themeStyle.border} bg-surface/90 shadow-2xl`}>
                  {/* Atmospheric background glow */}
                  <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${themeStyle.glow} rounded-full blur-3xl pointer-events-none`} />
                  <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Copy & CTAs */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs text-black dark:text-inherit bg-white/90 dark:bg-transparent">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-black dark:text-inherit">{isDe ? currentDevice.badge.de : currentDevice.badge.en}</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs uppercase font-bold tracking-widest text-muted block">
                          {currentDevice.brand} Exklusiv
                        </span>
                        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-heading leading-tight">
                          {currentDevice.name}
                        </h2>
                        <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl">
                          {isDe ? currentDevice.tagline.de : currentDevice.tagline.en}
                        </p>
                      </div>

                      {/* Pricing Tag & Savings */}
                      <div className="flex flex-wrap items-baseline gap-3 pt-2">
                        <span className="text-3xl sm:text-4xl font-black text-heading">
                          {currentDevice.priceTag}
                        </span>
                        <span className="text-sm sm:text-base text-muted/60 line-through">
                          {currentDevice.originalPrice}
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {currentDevice.savings}
                        </span>
                      </div>

                      {/* Key Feature Bullets */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {currentDevice.features.slice(0, 2).map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-background/60 border border-border/50">
                            <span className="text-lg">{feat.icon}</span>
                            <div>
                              <h4 className="text-xs font-bold text-heading">{isDe ? feat.title.de : feat.title.en}</h4>
                              <p className="text-[11px] text-muted line-clamp-1">{isDe ? feat.desc.de : feat.desc.en}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-4 pt-4">
                        <Link
                          href={currentDevice.ctaPrimary.href}
                          className={`px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${themeStyle.button}`}
                        >
                          🛍️ {isDe ? currentDevice.ctaPrimary.de : currentDevice.ctaPrimary.en}
                        </Link>
                        <Link
                          href={currentDevice.ctaSecondary.href}
                          className="px-5 py-3.5 rounded-xl text-sm font-medium border border-border bg-surface hover:bg-surface-strong text-heading transition"
                        >
                          🔍 {isDe ? currentDevice.ctaSecondary.de : currentDevice.ctaSecondary.en}
                        </Link>
                      </div>
                    </div>

                    {/* Right Visual 3D Showcase Card */}
                    <div className="lg:col-span-5 flex justify-center relative">
                      <div className="relative w-full max-w-[340px] aspect-4/5 rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-b from-background-alt to-surface shadow-2xl flex flex-col justify-between p-6">
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span className="font-semibold text-heading">{currentDevice.brand} Flagship</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-strong border border-border text-[10px]">
                            Neuheit 2026
                          </span>
                        </div>

                        {/* Centered Device Graphic Mockup / Image */}
                        <div className="relative my-auto py-6 flex flex-col items-center text-center space-y-4">
                          <div className="w-32 h-44 sm:w-40 sm:h-56 rounded-2xl border-2 border-gold/40 bg-gradient-to-tr from-surface to-background shadow-2xl relative flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-rose-500/10" />
                            <span className="text-4xl sm:text-5xl drop-shadow-lg">📱</span>
                            <div className="absolute bottom-2 inset-x-2 text-center py-1 bg-black/60 backdrop-blur-xs rounded-md text-[9px] text-gold font-bold">
                              {currentDevice.name}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-heading block">
                              {isDe ? "Inklusive Apfel Park Schutz" : "Includes Apfel Park Protection"}
                            </span>
                            <span className="text-[11px] text-muted block">
                              ✓ 12M Garantie · ✓ Werkstattgeprüft · ✓ Hamburg Support
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted">
                          <span>📦 Sofort lieferbar</span>
                          <span className="text-emerald-400 font-semibold">Auf Lager</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VARIATION 2: SPLIT-FEATURE INTERACTIVE BILLBOARD */}
              {billboardVariation === "split" && (
                <div className="rounded-3xl border border-border bg-surface p-6 sm:p-10 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
                    <div>
                      <span className="text-xs font-bold text-gold uppercase tracking-wider">
                        {isDe ? "Spotlight der Woche" : "Spotlight of the Week"}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-heading mt-1">
                        {currentDevice.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-heading">{currentDevice.priceTag}</span>
                      <Link
                        href={currentDevice.ctaPrimary.href}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold ${themeStyle.button}`}
                      >
                        {isDe ? "Zum Angebot" : "View Deal"}
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentDevice.features.map((feat, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-background/80 border border-border/60 space-y-2 hover:border-gold/40 transition">
                        <span className="text-2xl">{feat.icon}</span>
                        <h4 className="font-bold text-sm text-heading">{isDe ? feat.title.de : feat.title.en}</h4>
                        <p className="text-xs text-muted leading-relaxed">{isDe ? feat.desc.de : feat.desc.en}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VARIATION 3: SLIM CATALOG HIGHLIGHT (Store Top) */}
              {billboardVariation === "slim" && (
                <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-surface via-surface to-background p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-2xl shrink-0">
                      ✨
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {isDe ? "Neuheit" : "New Release"}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-heading">
                          {currentDevice.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted mt-0.5 max-w-xl line-clamp-1">
                        {isDe ? currentDevice.tagline.de : currentDevice.tagline.en}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-lg font-bold text-heading">{currentDevice.priceTag}</span>
                    <Link
                      href={currentDevice.ctaPrimary.href}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-gold text-black hover:bg-gold-soft transition"
                    >
                      {isDe ? "Jetzt sichern" : "Get It Now"}
                    </Link>
                  </div>
                </div>
              )}

              {/* VARIATION 4: TRUST & B-WARE BANNER (Store Mid) */}
              {billboardVariation === "trust" && (
                <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-surface via-surface to-emerald-950/20 p-6 sm:p-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <span>🛡️</span>
                    <span>{isDe ? "Apfel Park Qualitätsversprechen" : "Apfel Park Quality Promise"}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-heading">
                    {isDe ? "Geprüfte Smartphones & 12 Monate Garantie" : "Tested Smartphones & 12 Months Warranty"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
                    {isDe
                      ? "Jedes Gerät wird in unserer Hamburger Fachwerkstatt auf über 30 Funktionen geprüft (Akku, Display, Kameras, Sensoren). Spare bis zu 40% gegenüber Neupreis mit voller Sicherheit."
                      : "Every device is tested across 30+ hardware checkpoints in our Hamburg workshop. Save up to 40% vs retail price with full buyer protection."}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-lg text-xs bg-surface-strong border border-border text-heading">
                      ✓ 30 Tage Rückgaberecht
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs bg-surface-strong border border-border text-heading">
                      ✓ Kostenlose Abholung in Hamburg
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs bg-surface-strong border border-border text-heading">
                      ✓ DHL Expressversand in DE
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TECHNICAL SPECIFICATIONS GRID */}
        {activeTab === "specs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-gold">
                  {currentDevice.brand} Flagship
                </span>
                <h3 className="text-2xl font-bold text-heading mt-0.5">
                  {currentDevice.name} – {isDe ? "Vollständige Spezifikationen" : "Full Technical Specifications"}
                </h3>
              </div>
              <span className="text-xl font-extrabold text-gold">{currentDevice.priceTag}</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <table className="w-full text-left text-sm divide-y divide-border">
                <tbody className="divide-y divide-border">
                  {currentDevice.specs.map((spec, i) => (
                    <tr key={i} className="hover:bg-surface-strong/50 transition">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-muted text-xs sm:text-sm w-1/3">
                        {isDe ? spec.label.de : spec.label.en}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-heading font-medium text-xs sm:text-sm">
                        {isDe ? spec.value.de : spec.value.en}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OFFICIAL VIDEO SHOWCASE */}
        {activeTab === "video" && (
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-gold">
                {currentDevice.brand} Video Showcase
              </span>
              <h3 className="text-2xl font-bold text-heading mt-0.5">
                {currentDevice.videoTitle || currentDevice.name}
              </h3>
              <p className="text-xs text-muted mt-1">
                {isDe
                  ? "Offizielles Produktvideo & Keynote Feature Präsentation"
                  : "Official product video and keynote feature presentation"}
              </p>
            </div>

            {/* Video Player Container */}
            <div className="relative w-full aspect-16/9 rounded-3xl overflow-hidden border border-border bg-black shadow-2xl flex items-center justify-center group">
              <div className="text-center space-y-3 p-6">
                <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center text-2xl mx-auto shadow-lg group-hover:scale-110 transition">
                  ▶
                </div>
                <h4 className="font-bold text-base text-white">
                  {currentDevice.name} – Official Launch Film
                </h4>
                <span className="text-xs text-neutral-400 block max-w-md">
                  {isDe
                    ? "In der finalen Version binden wir hier das offizielle 4K YouTube Video des Herstellers ein."
                    : "In the production release, the official 4K manufacturer YouTube video will be embedded here."}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
