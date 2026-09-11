"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import IPhoneBanner from "@/components/banner/IPhoneBanner";

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
  billboardImage: string;
  productImage: string;
  imageAlt: string;
  youtubeId?: string;
  videoTitle?: string;
  specs: Array<{ label: { de: string; en: string }; value: { de: string; en: string } }>;
  features: Array<{ icon: string; title: { de: string; en: string }; desc: { de: string; en: string } }>;
  hotspots: Array<{ x: number; y: number; title: { de: string; en: string }; desc: { de: string; en: string } }>;
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
    theme: "gold",
    billboardImage: "/images/billboards/iphone-duo-billboard.jpg",
    productImage: "/images/billboards/iphone-duo-product.jpg",
    imageAlt: "Apple iPhone Duo Foldable Smartphone Billboard",
    youtubeId: "dQw4w9WgXcQ",
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
    hotspots: [
      { x: 30, y: 35, title: { de: "Ultra Thin Glass (UTG)", en: "Ultra Thin Glass (UTG)" }, desc: { de: "Nahtloses 7.6\" Innen-Display ohne sichtbaren Knick.", en: "Seamless 7.6\" inner canvas with invisible hinge fold." } },
      { x: 50, y: 25, title: { de: "Titan-Scharnier Grad 5", en: "Grade 5 Titanium Hinge" }, desc: { de: "Aerospace-Titanium für 400.000+ Faltzyklen getestet.", en: "Aerospace titanium tested for 400,000+ fold cycles." } },
      { x: 45, y: 75, title: { de: "Apple A20 Pro 2nm", en: "Apple A20 Pro 2nm" }, desc: { de: "Weltweit erster 2nm Mobilprozessor mit Raytracing.", en: "World's first 2nm mobile SoC with raytracing." } },
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
    billboardImage: "/images/billboards/iphone-18-pro-max-billboard.jpg",
    productImage: "/images/billboards/iphone-18-pro-max-product.jpg",
    imageAlt: "Apple iPhone 18 Pro Max Smartphone Billboard",
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
    hotspots: [
      { x: 38, y: 22, title: { de: "Variable Blende f/1.5–f/4.0", en: "Variable Aperture f/1.5–f/4.0" }, desc: { de: "Echtes mechanisches Objektiv für professionelle Porträts.", en: "Real mechanical lens iris for studio-grade depth." } },
      { x: 72, y: 38, title: { de: "Glacier Blue Titanium", en: "Glacier Blue Titanium" }, desc: { de: "Micro-blasted Titanoberfläche mit PVD-Farbveredelung.", en: "Micro-blasted titanium surface with PVD coating." } },
      { x: 42, y: 70, title: { de: "Vapor Chamber Cooling", en: "Vapor Chamber Cooling" }, desc: { de: "Hält das Gerät bis zu 6°C kühler unter Dauerlast.", en: "Keeps SoC up to 6°C cooler under heavy compute loads." } },
    ],
    ctaPrimary: { de: "iPhone 18 Pro Max ansehen", en: "Explore iPhone 18 Pro Max", href: "#" },
    ctaSecondary: { de: "Altgerät in Zahlung geben", en: "Trade-in current phone", href: "#trade-in" },
  },
  {
    id: "samsung-galaxy-z-fold",
    brand: "Samsung",
    name: "Samsung Galaxy Z Fold Series",
    badge: {
      de: "⚡ Next-Gen Faltbares Kraftpaket",
      en: "⚡ Next-Gen Foldable Powerhouse",
    },
    tagline: {
      de: "7.6\" Dynamic AMOLED 2X Hauptbildschirm · Snapdragon 8 Gen for Galaxy · Galaxy AI 2.0 Live-Dolmetscher · Armor Aluminum",
      en: "7.6\" Dynamic AMOLED 2X Main Screen · Snapdragon 8 Gen for Galaxy · Galaxy AI 2.0 Live Interpreter · Armor Aluminum",
    },
    priceTag: "ab 1.499 €",
    originalPrice: "UVP 1.899 €",
    savings: "Bis zu 400 € Rabatt als B-Ware / Neu",
    theme: "gold",
    billboardImage: "/images/billboards/samsung-z-fold-billboard.jpg",
    productImage: "/images/billboards/samsung-z-fold-product.jpg",
    imageAlt: "Samsung Galaxy Z Fold Billboard Showcase",
    youtubeId: "dQw4w9WgXcQ",
    videoTitle: "Samsung Galaxy Z Fold – Official Unpacked Highlights",
    specs: [
      { label: { de: "Hauptbildschirm", en: "Main Screen" }, value: { de: "7.6\" Dynamic AMOLED 2X, 120Hz, 2.600 Nits, HDR10+", en: "7.6\" Dynamic AMOLED 2X, 120Hz, 2,600 Nits, HDR10+" } },
      { label: { de: "Frontbildschirm", en: "Cover Screen" }, value: { de: "6.3\" Dynamic AMOLED 2X (22:9 Format)", en: "6.3\" Dynamic AMOLED 2X (22:9 Ratio)" } },
      { label: { de: "Prozessor", en: "Processor" }, value: { de: "Snapdragon 8 Gen 3 for Galaxy (4nm Octa-Core)", en: "Snapdragon 8 Gen 3 for Galaxy (4nm Octa-Core)" } },
      { label: { de: "Galaxy AI", en: "Galaxy AI" }, value: { de: "Dual-Screen Live Translate, Circle to Search & AI Generative Edit", en: "Dual-Screen Live Translate, Circle to Search & AI Generative Edit" } },
      { label: { de: "S Pen Support", en: "S Pen Support" }, value: { de: "Präzises Zeichnen & Notizen auf dem Hauptbildschirm", en: "Precision drawing & note-taking on main display" } },
      { label: { de: "Gehäuse", en: "Build" }, value: { de: "Armor Aluminum Rahmen & Corning Gorilla Glass Victus 2", en: "Armor Aluminum Frame & Corning Gorilla Glass Victus 2" } },
    ],
    features: [
      { icon: "🌐", title: { de: "Galaxy AI Dolmetscher", en: "Galaxy AI Live Interpreter" }, desc: { de: "Zwei Gesprächspartner sehen Übersetzungen simultan auf beiden Bildschirmen.", en: "Two speakers view real-time translations simultaneously on both screens." } },
      { icon: "✍️", title: { de: "S Pen Produktivität", en: "S Pen Productivity" }, desc: { de: "Dokumente signieren, Skizzen anfertigen und Multi-Window Workflows.", en: "Sign documents, create precise sketches and multi-app multitasking." } },
      { icon: "💧", title: { de: "IP48 Wasserresistent", en: "IP48 Water Resistant" }, desc: { de: "Robustes Scharnier mit doppeltem Schienensystem gegen Partikel.", en: "Rugged hinge with dual rail system protecting against water and dust." } },
      { icon: "🔄", title: { de: "Inzahlungnahme Bonus", en: "Trade-In Bonus" }, desc: { de: "Altes Samsung oder iPhone abgeben und Sofortrabatt sichern.", en: "Trade in your older Samsung or iPhone for instant cash credit." } },
    ],
    hotspots: [
      { x: 62, y: 30, title: { de: "7.6\" Infinity Flex Display", en: "7.6\" Infinity Flex Display" }, desc: { de: "Brillantes 2.600 Nits AMOLED Display für Sonnenlicht.", en: "Ultra-bright 2,600 nits AMOLED under direct sunlight." } },
      { x: 48, y: 60, title: { de: "Armor Aluminum Scharnier", en: "Armor Aluminum Hinge" }, desc: { de: "Ultra-schlankes Zero-Gap Faltdesign.", en: "Ultra-slim zero-gap folding design." } },
      { x: 25, y: 50, title: { de: "FlexMode Standfuß", en: "FlexMode Free Stand" }, desc: { de: "Handfreies Aufstellen für Video-Calls und Nachtaufnahmen.", en: "Hands-free stand for video conferences and astrophotography." } },
    ],
    ctaPrimary: { de: "Samsung Z Fold Angebote", en: "Explore Samsung Z Fold Deals", href: "#" },
    ctaSecondary: { de: "B-Ware Zustand prüfen", en: "Inspect B-Ware Condition", href: "#condition" },
  },
  {
    id: "google-pixel-11-pro",
    brand: "Google",
    name: "Google Pixel 11 Pro Series",
    badge: {
      de: "🤖 Maximale Google KI & Kamera-Power",
      en: "🤖 Pure Google AI & Ultimate Camera",
    },
    tagline: {
      de: "Google Tensor G & Gemini Nano on-device · 6.8\" Super Actua 3.000 Nits · Triple 50 MP Kamera mit 5x Telezoom & 30x Super Res Zoom",
      en: "Google Tensor G & Gemini Nano on-device · 6.8\" Super Actua 3,000 Nits · Triple 50 MP Camera with 5x Tele & 30x Super Res Zoom",
    },
    priceTag: "ab 999 €",
    originalPrice: "UVP 1.199 €",
    savings: "Top Deal: 200 € Direktabzug",
    theme: "mint",
    billboardImage: "/images/billboards/google-pixel-11-billboard.jpg",
    productImage: "/images/billboards/google-pixel-11-product.jpg",
    imageAlt: "Google Pixel 11 Pro Billboard Showcase",
    youtubeId: "dQw4w9WgXcQ",
    videoTitle: "Google Pixel 11 Pro – Built with Gemini AI",
    specs: [
      { label: { de: "Display", en: "Display" }, value: { de: "6.8\" Super Actua LTPO OLED (1–120Hz), bis zu 3.000 Nits", en: "6.8\" Super Actua LTPO OLED (1–120Hz), up to 3,000 Nits" } },
      { label: { de: "Prozessor", en: "Processor" }, value: { de: "Google Tensor G mit On-Device Gemini Nano AI Engine", en: "Google Tensor G with On-Device Gemini Nano AI Engine" } },
      { label: { de: "Kamera-Setup", en: "Camera Setup" }, value: { de: "50 MP Hauptsensor + 48 MP Ultraweit + 48 MP 5x Tele (30x Zoom)", en: "50 MP Main + 48 MP Ultra-Wide + 48 MP 5x Telephoto (30x Zoom)" } },
      { label: { de: "Software-Support", en: "Software Support" }, value: { de: "7 Jahre garantierte Android OS- & Sicherheits-Updates", en: "7 Years guaranteed Android OS & Security Updates" } },
      { label: { de: "Akku & Laden", en: "Battery & Fast Charge" }, value: { de: "5.060 mAh mit 45W Fast-Charging & Qi2 Wireless", en: "5,060 mAh with 45W Fast Charging & Qi2 Wireless" } },
      { label: { de: "Materialien", en: "Materials" }, value: { de: "Mattiertes Glas, polierter Rahmen & 100% recyceltes Aluminium", en: "Matte glass, polished frame & 100% recycled aluminum" } },
    ],
    features: [
      { icon: "✨", title: { de: "Gemini Nano AI On-Device", en: "Gemini Nano AI On-Device" }, desc: { de: "Automatische Anrufzusammenfassung, intelligenter Magischer Editor und Audio-Radierer.", en: "Instant call summaries, generative Magic Editor and Audio Magic Eraser." } },
      { icon: "🔭", title: { de: "5x Optischer / 30x Super-Zoom", en: "5x Optical / 30x Super Zoom" }, desc: { de: "Verlustfreie Tele-Schärfe auch bei schwachem Abendlicht.", en: "Lossless telephoto sharpness even in challenging night scenarios." } },
      { icon: "🔒", title: { de: "7 Jahre Update-Garantie", en: "7 Years Update Guarantee" }, desc: { de: "Garantiert zukunftssicher bis mindestens 2033.", en: "Future-proof software reliability guaranteed through 2033." } },
      { icon: "♻️", title: { de: "Nachhaltig & Hamburg Refurbished", en: "Refurbished in Hamburg" }, desc: { de: "Fachmännisch geprüft im Apfel Park Fachzentrum Wilhelmsburg.", en: "Expertly certified at the Apfel Park workshop in Wilhelmsburg." } },
    ],
    hotspots: [
      { x: 38, y: 22, title: { de: "Kamera-Visor 50MP Triple", en: "50MP Triple Visor Array" }, desc: { de: "Ikonische Visor-Leiste mit 5x Tele und Macro-Focus.", en: "Iconic camera bar with 5x telephoto and macro focus." } },
      { x: 42, y: 35, title: { de: "Gemini AI Ambient Halo", en: "Gemini AI Ambient Halo" }, desc: { de: "Echtzeit-Feedback bei Sprach- und Kamera-Assistenz.", en: "Real-time dynamic glow during live voice & camera AI." } },
      { x: 70, y: 60, title: { de: "Super Actua 3000 Nits", en: "Super Actua 3,000 Nits" }, desc: { de: "Hellstes Display seiner Klasse mit 1-120Hz LTPO.", en: "Class-leading brightness with fluid 1-120Hz LTPO." } },
    ],
    ctaPrimary: { de: "Google Pixel 11 Pro bestellen", en: "Order Google Pixel 11 Pro", href: "#" },
    ctaSecondary: { de: "Kamera-Vergleich ansehen", en: "View camera comparison", href: "#camera" },
  },
];

type LayoutVariant = "cinematic-billboard" | "split-studio" | "store-ribbon" | "trust-bware" | "compact-apple-hero";
type ViewportSize = "desktop" | "tablet" | "mobile";

export default function BillboardPreviewLab({ lang }: { lang: Locale }) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("iphone-duo");
  const [activeLayout, setActiveLayout] = useState<LayoutVariant>("cinematic-billboard");
  const [activeViewport, setActiveViewport] = useState<ViewportSize>("desktop");
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [showAdminSim, setShowAdminSim] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"billboard" | "specs" | "gallery" | "video">("billboard");

  // Admin Live Simulator State (for real-time testing)
  const [customHeadline, setCustomHeadline] = useState("");
  const [customBadge, setCustomBadge] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customDiscountTag, setCustomDiscountTag] = useState("");

  const currentDevice = SHOWCASE_DEVICES.find((d) => d.id === selectedDeviceId) || SHOWCASE_DEVICES[0];

  const headline = customHeadline || currentDevice.name;
  const badge = customBadge || currentDevice.badge[lang];
  const price = customPrice || currentDevice.priceTag;
  const discountTag = customDiscountTag || currentDevice.savings;

  const getViewportMaxWidth = () => {
    switch (activeViewport) {
      case "mobile":
        return "max-w-[390px]";
      case "tablet":
        return "max-w-[768px]";
      case "desktop":
      default:
        return "max-w-7xl";
    }
  };

  const getThemeGlow = () => {
    switch (currentDevice.theme) {
      case "burgundy":
        return "from-rose-950/40 via-purple-950/20 to-zinc-950 border-rose-500/30";
      case "glacier":
        return "from-sky-950/40 via-blue-950/20 to-zinc-950 border-sky-500/30";
      case "gold":
        return "from-amber-950/40 via-yellow-950/20 to-zinc-950 border-amber-500/30";
      case "mint":
        return "from-emerald-950/40 via-teal-950/20 to-zinc-950 border-emerald-500/30";
      case "obsidian":
      default:
        return "from-zinc-900/60 via-zinc-950 to-black border-zinc-700/40";
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Studio Header Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">Apfel Park Billboard Design Studio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Staging / Test Lab
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {lang === "de"
                  ? "Interaktive Vorschau der neuen Flaggschiff-Billboards vor Live-Schaltung auf apfel-park.de"
                  : "Interactive flagship billboard staging lab prior to homepage & store deployment"}
              </p>
            </div>
          </div>

          {/* Quick Actions & Admin Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdminSim(!showAdminSim)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                showAdminSim
                  ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10 border-white/10"
              }`}
            >
              <span>⚙️</span>
              {lang === "de" ? "Live-Anpassungen (Admin Simulator)" : "Live Edit (Admin Simulator)"}
            </button>
            <Link
              href={`/${lang}/store`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              ← {lang === "de" ? "Zum Live-Store" : "To Live Store"}
            </Link>
          </div>
        </div>
      </header>

      {/* Control Bar: Model Switcher & Layout Variations */}
      <div className="border-b border-white/10 bg-zinc-950/60 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Device Model Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mr-1">Modell:</span>
            {SHOWCASE_DEVICES.map((device) => {
              const isSelected = device.id === selectedDeviceId;
              return (
                <button
                  key={device.id}
                  onClick={() => {
                    setSelectedDeviceId(device.id);
                    setActiveHotspot(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold shadow-lg shadow-amber-500/20 scale-[1.02]"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 hover:border-white/15"
                  }`}
                >
                  <span>{device.brand === "Apple" ? "🍎" : device.brand === "Samsung" ? "🌌" : "🤖"}</span>
                  {device.name}
                </button>
              );
            })}
          </div>

          {/* Billboard Layout Variations & Viewport Simulator */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
              {(
                [
                  { id: "compact-apple-hero", label: { de: "Storefront Compact Banner", en: "Store Compact Banner" }, icon: "🍏" },
                  { id: "cinematic-billboard", label: { de: "Billboard Großformat", en: "Grand Billboard" }, icon: "🎬" },
                  { id: "split-studio", label: { de: "3D Split Studio", en: "3D Split Studio" }, icon: "💎" },
                  { id: "store-ribbon", label: { de: "Storefront Ribbon", en: "Store Ribbon" }, icon: "🛍️" },
                  { id: "trust-bware", label: { de: "B-Ware & Trust", en: "B-Ware Trust" }, icon: "🛡️" },
                ] as const
              ).map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setActiveLayout(variant.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                    activeLayout === variant.id
                      ? "bg-white/20 text-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>{variant.icon}</span>
                  <span className="hidden sm:inline">{variant.label[lang]}</span>
                </button>
              ))}
            </div>

            {/* Viewport Width Toggle */}
            <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
              {(
                [
                  { id: "desktop", label: "Desktop", icon: "🖥️" },
                  { id: "tablet", label: "Tablet (768)", icon: "📱" },
                  { id: "mobile", label: "Mobil (390)", icon: "📲" },
                ] as const
              ).map((vp) => (
                <button
                  key={vp.id}
                  onClick={() => setActiveViewport(vp.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                    activeViewport === vp.id
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title={vp.label}
                >
                  <span>{vp.icon}</span>
                  <span className="hidden lg:inline">{vp.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Simulator Drawer (Collapsible) */}
      {showAdminSim && (
        <div className="border-b border-amber-500/30 bg-amber-950/20 backdrop-blur-md px-4 lg:px-8 py-4 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">⚙️ Admin Live-Control Simulator</span>
                <span className="text-xs text-zinc-400">
                  {lang === "de"
                    ? "Passen Sie Überschriften, Rabatt-Badges und Preise in Echtzeit an, um die Billboard-Wirkung zu testen."
                    : "Simulate real-time edits for title, discount badge, and pricing before publishing to production."}
                </span>
              </div>
              <button
                onClick={() => {
                  setCustomHeadline("");
                  setCustomBadge("");
                  setCustomPrice("");
                  setCustomDiscountTag("");
                }}
                className="text-xs text-amber-400 hover:underline"
              >
                {lang === "de" ? "Auf Standard zurücksetzen" : "Reset to Default"}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Headline Text
                </label>
                <input
                  type="text"
                  value={customHeadline}
                  placeholder={currentDevice.name}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Badge Pill Text
                </label>
                <input
                  type="text"
                  value={customBadge}
                  placeholder={currentDevice.badge[lang]}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Preis-Anzeige
                </label>
                <input
                  type="text"
                  value={customPrice}
                  placeholder={currentDevice.priceTag}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Ersparnis / Promotion Tag
                </label>
                <input
                  type="text"
                  value={customDiscountTag}
                  placeholder={currentDevice.savings}
                  onChange={(e) => setCustomDiscountTag(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Showcase Stage Area */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Viewport Frame Container */}
        <div className={`mx-auto transition-all duration-300 ${getViewportMaxWidth()}`}>
          {activeViewport !== "desktop" && (
            <div className="text-center mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono bg-white/10 text-amber-300 border border-white/15">
                Simulierte Ansicht: {activeViewport.toUpperCase()} ({activeViewport === "tablet" ? "768px" : "390px"})
              </span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VARIATION 0: COMPACT STOREFRONT HERO BANNER (WEBP ASSETS + GLASS STAGE)   */}
          {/* ========================================================================= */}
          {activeLayout === "compact-apple-hero" && (
            <section className="mb-12">
              <IPhoneBanner shopHref={`/${lang}/store`} />
            </section>
          )}

          {/* ========================================================================= */}
          {/* VARIATION 1: GRAND CINEMATIC BILLBOARD WITH REAL HIGH-RES BANNER           */}
          {/* ========================================================================= */}
          {activeLayout === "cinematic-billboard" && (
            <section className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black group mb-12">
              {/* Ultra High-Res Billboard Graphic Container */}
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentDevice.billboardImage}
                  alt={currentDevice.imageAlt}
                  className="w-full h-full object-cover object-center transform group-hover:scale-[1.015] transition-transform duration-700 ease-out"
                />

                {/* Subtle Interactive Lighting Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Live Interactive Pre-order & Hamburg Guarantee Overlay Bar */}
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 md:p-8 flex flex-wrap items-end justify-between gap-4 backdrop-blur-md bg-black/40 border-t border-white/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {badge}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-zinc-300 border border-white/10">
                        ⭐ Apfel Park Exklusiv
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                      {headline}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-300 max-w-xl line-clamp-2 mt-1">
                      {currentDevice.tagline[lang]}
                    </p>
                  </div>

                  {/* Pricing and Action Hub */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-zinc-400 line-through">{currentDevice.originalPrice}</div>
                      <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">{price}</div>
                      <div className="text-[10px] font-semibold text-emerald-400">{discountTag}</div>
                    </div>

                    <button
                      onClick={() => alert(`Vorbestellung für ${currentDevice.name} eingeleitet!`)}
                      className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black shadow-lg shadow-amber-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🛒</span>
                      {currentDevice.ctaPrimary[lang]}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* VARIATION 2: 3D SPLIT STUDIO WITH PHOTOREALISTIC DEVICE RENDER & HOTSPOTS   */}
          {/* ========================================================================= */}
          {activeLayout === "split-studio" && (
            <section className={`relative rounded-3xl overflow-hidden border p-6 sm:p-10 bg-gradient-to-br ${getThemeGlow()} shadow-2xl mb-12`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Column: Device Copy, Feature Grid & Buy Box */}
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-white/10 text-amber-300 border border-white/15 mb-3">
                      <span>{currentDevice.brand === "Apple" ? "🍎" : currentDevice.brand === "Samsung" ? "🌌" : "🤖"}</span>
                      {badge}
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                      {headline}
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
                      {currentDevice.tagline[lang]}
                    </p>
                  </div>

                  {/* 4 Breakthrough Features Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentDevice.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition backdrop-blur-md"
                      >
                        <div className="text-xl mb-1.5">{feature.icon}</div>
                        <h4 className="text-xs font-bold text-white mb-0.5">{feature.title[lang]}</h4>
                        <p className="text-[11px] text-zinc-400 leading-snug">{feature.desc[lang]}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pricing and CTAs */}
                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                      <div className="text-xs text-zinc-400">{lang === "de" ? "Apfel Park Vorteilspreis" : "Apfel Park Offer"}</div>
                      <div className="text-2xl font-black text-amber-400">{price}</div>
                    </div>

                    <button
                      onClick={() => alert(`Vorbestellung für ${currentDevice.name} eingeleitet!`)}
                      className="flex-1 min-w-[180px] px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-black shadow-lg shadow-amber-500/25 transition transform hover:-translate-y-0.5 text-center cursor-pointer"
                    >
                      {currentDevice.ctaPrimary[lang]} →
                    </button>
                  </div>
                </div>

                {/* Right Column: Ultra-Realistic Product Render with Interactive Hotspots */}
                <div className="lg:col-span-6 relative">
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl group aspect-[4/3] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentDevice.productImage}
                      alt={currentDevice.imageAlt}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Interactive Hotspots Overlaid on Phone Hardware */}
                    {currentDevice.hotspots.map((spot, idx) => (
                      <div
                        key={idx}
                        style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                      >
                        <button
                          onClick={() => setActiveHotspot(activeHotspot === idx ? null : idx)}
                          className="relative group/spot w-8 h-8 rounded-full bg-amber-500/80 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/50 transition transform hover:scale-110 cursor-pointer"
                        >
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative">＋</span>
                        </button>

                        {/* Hotspot Tooltip Popup */}
                        {activeHotspot === idx && (
                          <div className="absolute left-10 top-0 z-30 w-56 p-3 rounded-xl bg-zinc-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl text-left animate-in fade-in">
                            <div className="text-xs font-bold text-amber-300">{spot.title[lang]}</div>
                            <div className="text-[11px] text-zinc-300 mt-1">{spot.desc[lang]}</div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-[10px] text-zinc-400 border border-white/10">
                      💡 {lang === "de" ? "Klicke auf ＋ für Hardware-Details" : "Click ＋ for hardware hotspots"}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* VARIATION 3: STOREFRONT RIBBON (HIGH DENSITY CATALOG STRIP)               */}
          {/* ========================================================================= */}
          {activeLayout === "store-ribbon" && (
            <section className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-4 sm:p-6 shadow-xl mb-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Miniature Product Thumbnail */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/80 border border-white/10 flex-shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentDevice.productImage}
                      alt={currentDevice.imageAlt}
                      className="w-full h-full object-contain p-1 hover:scale-110 transition"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-black">
                        Store Spotlight
                      </span>
                      <span className="text-xs text-zinc-400">{currentDevice.brand}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">{headline}</h3>
                    <p className="text-xs text-zinc-400 max-w-md mt-0.5 line-clamp-1">
                      {currentDevice.tagline[lang]}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-lg font-extrabold text-amber-400">{price}</span>
                      <span className="text-xs text-zinc-400 line-through">{currentDevice.originalPrice}</span>
                      <span className="text-xs font-semibold text-emerald-400">({discountTag})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => alert(`Vorbestellung für ${currentDevice.name} eingeleitet!`)}
                    className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition cursor-pointer"
                  >
                    {currentDevice.ctaPrimary[lang]}
                  </button>
                  <button
                    onClick={() => setActiveTab("specs")}
                    className="px-4 py-3 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/15 text-white border border-white/10 transition cursor-pointer"
                  >
                    Specs
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* VARIATION 4: TRUST & HAMBURG B-WARE BILLBOARD                             */}
          {/* ========================================================================= */}
          {activeLayout === "trust-bware" && (
            <section className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-zinc-950 to-black p-6 sm:p-10 shadow-2xl mb-12">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span>🛡️</span>
                  {lang === "de" ? "100% Geprüfte Händler-Qualität · Apfel Park Hamburg" : "100% Certified Dealer Quality · Apfel Park Hamburg"}
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {headline} {lang === "de" ? "mit 12 Monaten Garantie" : "with 12-Month Warranty"}
                </h2>

                <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto">
                  {lang === "de"
                    ? "Sichern Sie sich die neuesten Flaggschiffe sofort vor Ort in Hamburg-Wilhelmsburg oder bequem mit versichertem 24h DHL Expressversand. Fachmännisch geprüft mit Zertifikat."
                    : "Get the latest flagships directly at our Hamburg-Wilhelmsburg store or via 24h insured DHL express shipping. Expertly tested with diagnostic certificate."}
                </p>

                {/* Trust Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-2">
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                    <div className="text-xl mb-1">📍</div>
                    <div className="text-xs font-bold text-white">{lang === "de" ? "Lokal in Hamburg" : "Hamburg Store"}</div>
                    <div className="text-[10px] text-zinc-400">Wilhelmsburg Fachfiliale</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                    <div className="text-xl mb-1">⭐</div>
                    <div className="text-xs font-bold text-white">4.8 / 5.0 Sterne</div>
                    <div className="text-[10px] text-zinc-400">211+ Verifizierte Google Reviews</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                    <div className="text-xl mb-1">🛡️</div>
                    <div className="text-xs font-bold text-white">12 Monate Garantie</div>
                    <div className="text-[10px] text-zinc-400">Volle Händlerabsicherung</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
                    <div className="text-xl mb-1">🔄</div>
                    <div className="text-xs font-bold text-white">Altgerät Inzahlung</div>
                    <div className="text-[10px] text-zinc-400">Sofortige Bar-/Kreditverrechnung</div>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => alert(`Vorbestellung für ${currentDevice.name} eingeleitet!`)}
                    className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 text-black shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                  >
                    {currentDevice.ctaPrimary[lang]} ({price})
                  </button>
                  <Link
                    href={`/${lang}/contact`}
                    className="px-6 py-3.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
                  >
                    {lang === "de" ? "Filiale in Hamburg besuchen" : "Visit Hamburg Store"}
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* DEEP DIVE TABS: TECHNICAL SPECS, ASSET GALLERY & VIDEO TRAILERS            */}
          {/* ========================================================================= */}
          <section className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-xl mb-12">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
              {(
                [
                  { id: "billboard", label: { de: "Billboard Galerie (Alle 4 Modelle)", en: "Billboard Gallery (All 4)" }, icon: "🖼️" },
                  { id: "specs", label: { de: "Technische Spezifikationen", en: "Technical Specs" }, icon: "📊" },
                  { id: "video", label: { de: "Offizielle Video-Showcase", en: "Official Video Showcase" }, icon: "🎬" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label[lang]}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: ALL 4 BILLBOARD GRAPHICS IN HIGH RESOLUTION */}
            {activeTab === "billboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    {lang === "de" ? "Verfügbare Flaggschiff-Billboards" : "Available Flagship Billboards"}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {lang === "de" ? "Klicke auf ein Billboard, um es als aktive Vorschau zu wählen." : "Click any billboard to make it the active preview."}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {SHOWCASE_DEVICES.map((device) => (
                    <div
                      key={device.id}
                      onClick={() => {
                        setSelectedDeviceId(device.id);
                        window.scrollTo({ top: 120, behavior: "smooth" });
                      }}
                      className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 ${
                        device.id === selectedDeviceId
                          ? "border-amber-500 ring-2 ring-amber-500/30 shadow-2xl scale-[1.01]"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div className="relative aspect-[16/9] bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={device.billboardImage}
                          alt={device.imageAlt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{device.name}</span>
                            <div className="text-[10px] text-amber-400">{device.priceTag} · {device.savings}</div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[10px]">
                            {device.id === selectedDeviceId ? "Aktiv" : "Auswählen →"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: TECHNICAL SPECS BREAKDOWN */}
            {activeTab === "specs" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{currentDevice.brand === "Apple" ? "🍎" : currentDevice.brand === "Samsung" ? "🌌" : "🤖"}</span>
                    {currentDevice.name} – {lang === "de" ? "Hardware & Spezifikationen" : "Hardware & Specs"}
                  </h3>
                  <span className="text-xs text-amber-400 font-mono">{currentDevice.priceTag}</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-white/5">
                      {currentDevice.specs.map((spec, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3.5 font-bold text-zinc-400 w-1/3 sm:w-1/4 bg-white/[0.02]">
                            {spec.label[lang]}
                          </td>
                          <td className="px-4 py-3.5 text-zinc-200 font-medium">
                            {spec.value[lang]}
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
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎬</span>
                  {currentDevice.videoTitle}
                </h3>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${currentDevice.youtubeId}?rel=0`}
                    title={currentDevice.videoTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
