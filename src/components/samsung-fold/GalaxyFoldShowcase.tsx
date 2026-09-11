"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { siteInfo } from "@/lib/site";

export type SamsungModelId = "fold8" | "ultra";

export type GalaxyFoldShowcaseProps = {
  locale: Locale;
  initialModel?: SamsungModelId;
};

type Finish = {
  id: string;
  nameDe: string;
  nameEn: string;
  colorHex: string;
  src: string;
};

const FOLD8_FINISHES: Finish[] = [
  {
    id: "pistachio",
    nameDe: "Pistachio",
    nameEn: "Pistachio",
    colorHex: "#8fb96a",
    src: "/images/samsung/zfold8/phone-pistachio.webp",
  },
  {
    id: "lavender",
    nameDe: "Lavender",
    nameEn: "Lavender",
    colorHex: "#b8a9d4",
    src: "/images/samsung/zfold8/phone-lavender.webp",
  },
  {
    id: "cream",
    nameDe: "Cream",
    nameEn: "Cream",
    colorHex: "#e8e2d8",
    src: "/images/samsung/zfold8/phone-cream.webp",
  },
  {
    id: "graphite",
    nameDe: "Graphite",
    nameEn: "Graphite",
    colorHex: "#3a3a3c",
    src: "/images/samsung/zfold8/phone-graphite.webp",
  },
];

const ULTRA_FINISHES: Finish[] = [
  {
    id: "violet",
    nameDe: "Violet Shadow",
    nameEn: "Violet Shadow",
    colorHex: "#9b8ec4",
    src: "/images/samsung/zfold8/ultra-violet.webp",
  },
  {
    id: "graphite",
    nameDe: "Graphite",
    nameEn: "Graphite",
    colorHex: "#3a3a3c",
    src: "/images/samsung/zfold8/ultra-graphite.webp",
  },
  {
    id: "cream",
    nameDe: "Cream",
    nameEn: "Cream",
    colorHex: "#e8e2d8",
    src: "/images/samsung/zfold8/ultra-cream.webp",
  },
  {
    id: "green",
    nameDe: "Green Shadow",
    nameEn: "Green Shadow",
    colorHex: "#6b9e6b",
    src: "/images/samsung/zfold8/ultra-green.webp",
  },
];

/* -------------------------------------------------------------------------- */
/* SVG Icons (Clean, Minimal, Accessible, Zero Emojis)                       */
/* -------------------------------------------------------------------------- */

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
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

function ChevronDownIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function GalaxyFoldShowcase({
  locale,
  initialModel = "fold8",
}: GalaxyFoldShowcaseProps) {
  const isDe = locale === "de";
  const [selectedModel, setSelectedModel] = useState<SamsungModelId>(initialModel);
  const [activeMediaTab, setActiveMediaTab] = useState<"video" | "colors" | "dual">("video");
  const [selectedFinishIndex, setSelectedFinishIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Switch active finishes list based on model
  const activeFinishes = selectedModel === "fold8" ? FOLD8_FINISHES : ULTRA_FINISHES;
  const currentFinish = activeFinishes[selectedFinishIndex] || activeFinishes[0];

  const handleSelectModel = (model: SamsungModelId) => {
    setSelectedModel(model);
    setSelectedFinishIndex(0);
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

  // Prefilled WhatsApp text
  const waText = encodeURIComponent(
    isDe
      ? `Guten Tag Apfel Park Team, ich interessiere mich für das Samsung ${
          selectedModel === "fold8" ? "Galaxy Z Fold8 (4,5 mm Slim)" : "Galaxy Z Fold8 Ultra (8 Zoll 200MP)"
        }. Bitte senden Sie mir ein unverbindliches Angebot sowie Informationen zu Verfügbarkeit und Abholung in Hamburg.`
      : `Hello Apfel Park Team, I am inquiring about the Samsung ${
          selectedModel === "fold8" ? "Galaxy Z Fold8 (4.5mm Slim)" : "Galaxy Z Fold8 Ultra (8-Inch 200MP)"
        }. Please provide pricing, availability and collection details in Hamburg.`
  );
  const whatsappUrl = `https://wa.me/${siteInfo.whatsapp}?text=${waText}`;

  // Prefilled Email link
  const emailSubject = encodeURIComponent(
    isDe
      ? `Anfrage: Samsung ${selectedModel === "fold8" ? "Galaxy Z Fold8" : "Galaxy Z Fold8 Ultra"}`
      : `Inquiry: Samsung ${selectedModel === "fold8" ? "Galaxy Z Fold8" : "Galaxy Z Fold8 Ultra"}`
  );
  const emailUrl = `mailto:${siteInfo.email}?subject=${emailSubject}`;

  // Tech Specs comparison table data
  const specRows = [
    {
      category: isDe ? "Formfaktor & Abmessungen" : "Form Factor & Dimensions",
      fold8: isDe ? "4,5 mm entfaltet · 10,4 mm gefaltet · 201g Gewicht (Ultra-Slim)" : "4.5 mm unfolded · 10.4 mm folded · 201g weight (Ultra-Slim)",
      ultra: isDe ? "5,4 mm entfaltet · 11,8 mm gefaltet · 235g Gewicht (Titanium Power)" : "5.4 mm unfolded · 11.8 mm folded · 235g weight (Titanium Power)",
    },
    {
      category: isDe ? "Hauptdisplay (Innen)" : "Main Display (Inner)",
      fold8: isDe ? "7,6\" Dynamic LTPO AMOLED 2X · 1-120 Hz · 3.000 Nits Spitzenhelligkeit · 1828 x 2448" : "7.6\" Dynamic LTPO AMOLED 2X · 1-120 Hz · 3,000 nits peak · 1828 x 2448",
      ultra: isDe ? "8,0\" Dynamic LTPO AMOLED 2X · 1-120 Hz · 3.200 Nits · S-Pen Digitizer · 2184 x 1968" : "8.0\" Dynamic LTPO AMOLED 2X · 1-120 Hz · 3,200 nits · S-Pen Digitizer · 2184 x 1968",
    },
    {
      category: isDe ? "Cover-Display (Außen)" : "Cover Screen (Outer)",
      fold8: isDe ? "5,5\" Dynamic LTPO AMOLED 2X · 120 Hz · 2.600 Nits" : "5.5\" Dynamic LTPO AMOLED 2X · 120 Hz · 2,600 nits",
      ultra: isDe ? "6,5\" Dynamic LTPO AMOLED 2X · 120 Hz · 3.000 Nits (Gorilla Glass Armor 2)" : "6.5\" Dynamic LTPO AMOLED 2X · 120 Hz · 3,000 nits (Gorilla Glass Armor 2)",
    },
    {
      category: isDe ? "Prozessor & KI-Engine" : "Processor & AI Silicon",
      fold8: "Qualcomm Snapdragon 8 Elite Gen 5 (3nm) · NPU 45 TOPS · Galaxy AI",
      ultra: "Qualcomm Snapdragon 8 Elite Gen 5 for Galaxy (3nm Overclocked) · Galaxy AI",
    },
    {
      category: isDe ? "Kamerasystem" : "Camera Optics",
      fold8: isDe ? "Duales 50 MP System: 50 MP Weitwinkel (f/1.8, OIS) + 50 MP Ultraweitwinkel (f/1.9)" : "Dual 50MP System: 50MP Wide (f/1.8, OIS) + 50MP Ultra-Wide (f/1.9)",
      ultra: isDe ? "Triple Pro System: 200 MP Hauptsensor (f/1.7, OIS) + 50 MP Ultraweit + 50 MP Periskop-Tele (5x optisch, 100x Space Zoom)" : "Triple Pro System: 200MP Main (f/1.7, OIS) + 50MP Ultra-Wide + 50MP Periscope (5x optical, 100x Space Zoom)",
    },
    {
      category: isDe ? "Arbeitsspeicher & Speicher" : "Memory & Storage",
      fold8: "12 GB / 16 GB LPDDR5X · 256 GB / 512 GB / 1 TB UFS 4.0",
      ultra: "16 GB LPDDR5X · 512 GB / 1 TB UFS 4.0",
    },
    {
      category: isDe ? "Akku & Schnellladung" : "Battery & Charging",
      fold8: isDe ? "4.800 mAh · 45W kabelgebunden · 20W Fast Wireless · Wireless PowerShare" : "4,800 mAh · 45W wired · 20W Fast Wireless · Wireless PowerShare",
      ultra: isDe ? "5.000 mAh Dual-Zelle · 45W kabelgebunden · 25W Fast Wireless · PowerShare" : "5,000 mAh Dual-Cell · 45W wired · 25W Fast Wireless · PowerShare",
    },
    {
      category: isDe ? "Gehäuse & Zertifizierung" : "Build & Durability",
      fold8: isDe ? "Verstärktes Armor Aluminum · Flex Teardrop Zero-Gap Scharnier · IP48" : "Reinforced Armor Aluminum · Flex Teardrop Zero-Gap Hinge · IP48",
      ultra: isDe ? "Grade 5 Titanrahmen · Reflexionsarmes Armor 2 Glas · Zero-Gap Scharnier · IP48" : "Grade 5 Titanium frame · Anti-reflective Armor 2 glass · Zero-Gap Hinge · IP48",
    },
  ];

  // FAQ entries
  const faqs = [
    {
      qDe: "Wann ist das Samsung Galaxy Z Fold8 in Deutschland erhältlich?",
      qEn: "When is the Samsung Galaxy Z Fold8 available in Germany?",
      aDe: "Das Samsung Galaxy Z Fold8 wurde im Sommer 2026 offiziell vorgestellt und ist bei Apfel Park ab sofort bestellbar. Alle Geräte sind vertragsfrei und für alle Netze freigeschaltet.",
      aEn: "The Samsung Galaxy Z Fold8 launched in Summer 2026 and is available for order at Apfel Park. All units are factory unlocked for all carriers.",
    },
    {
      qDe: "Wie unterscheidet sich das Galaxy Z Fold8 vom Z Fold8 Ultra?",
      qEn: "How does the Galaxy Z Fold8 differ from the Z Fold8 Ultra?",
      aDe: "Das Galaxy Z Fold8 setzt mit nur 4,5 mm Dicke und 201g auf maximale Leichtigkeit und Handlichkeit. Das Z Fold8 Ultra bietet ein größeres 8-Zoll-Display, einen 200 MP Kamerasensor mit 5x Periskop-Telezoom, S-Pen Digitizer-Integration und ein Gehäuse aus Grade 5 Titan.",
      aEn: "The Galaxy Z Fold8 focuses on extreme thinness (4.5mm) and portability at just 201g. The Z Fold8 Ultra provides an expansive 8-inch canvas, a 200MP camera with 5x periscope telephoto zoom, S-Pen digitizer integration, and Grade 5 titanium construction.",
    },
    {
      qDe: "Hat das Galaxy Z Fold8 einen störenden Falz im Innendisplay?",
      qEn: "Does the Galaxy Z Fold8 have a noticeable screen crease?",
      aDe: "Samsung verwendet beim Z Fold8 die neueste Generation des Flex Teardrop Zero-Gap Scharniers. Der Displayfalz wurde im Vergleich zu früheren Generationen drastisch minimiert und ist im täglichen Betrieb nahezu unsichtbar.",
      aEn: "Samsung equips the Z Fold8 with its latest Flex Teardrop Zero-Gap hinge. The inner display crease has been substantially diminished and is virtually invisible in everyday use.",
    },
    {
      qDe: "Sind die Geräte ohne Vertrag und für alle SIM-Karten geeignet?",
      qEn: "Are the devices unlocked without contract for all carriers?",
      aDe: "Ja, alle bei Apfel Park verkauften Smartphones sind zu 100% vertragsfrei (ohne SIM-Lock) und unterstützen Dual-SIM sowie eSIM für alle deutschen und internationalen Mobilfunkanbieter.",
      aEn: "Yes, all smartphones sold at Apfel Park are 100% factory unlocked without SIM-lock, supporting Dual-SIM and eSIM across all German and global carriers.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-gold selection:text-black">
      {/* Editorial Sub-Navigation & Breadcrumbs */}
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
            <Link href={`/${locale}/samsung-handys`} className="hover:text-gold transition-colors">
              {isDe ? "Samsung" : "Samsung"}
            </Link>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">
              {selectedModel === "fold8" ? "Galaxy Z Fold8" : "Galaxy Z Fold8 Ultra"}
            </span>
          </nav>

          <div className="flex items-center gap-2 text-muted">
            <span className="size-1.5 rounded-full bg-gold" />
            <span>{isDe ? "Hamburg Boutique & bundesweiter Versand" : "Hamburg Boutique & Nationwide Shipping"}</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-surface/80 via-background to-background pt-14 pb-16">
        <div className="container-page relative z-10 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-gold uppercase">
              <span>{isDe ? "Samsung Flaggschiff Innovation 2026" : "Samsung Flagship Innovation 2026"}</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl font-sans text-balance">
              {selectedModel === "fold8" ? (
                <>
                  Galaxy Z Fold8
                  <span className="block text-2xl sm:text-4xl lg:text-5xl font-medium text-muted mt-2">
                    {isDe ? "Die neue Ära des Faltens. Nur 4,5 mm dünn." : "The New Era of Folding. Record 4.5mm Ultra-Slim."}
                  </span>
                </>
              ) : (
                <>
                  Galaxy Z Fold8 Ultra
                  <span className="block text-2xl sm:text-4xl lg:text-5xl font-medium text-muted mt-2">
                    {isDe ? "Das 8-Zoll-Flaggschiff mit 200 MP Optik." : "The 8-Inch Powerhouse with 200MP Optics."}
                  </span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted leading-relaxed text-balance">
              {selectedModel === "fold8"
                ? (isDe
                  ? "Samsungs dünnstes und leichtestes Foldable aller Zeiten. 7,6-Zoll Dynamic LTPO AMOLED 2X, 5,5-Zoll Cover, Snapdragon 8 Elite Gen 5 und robustes Armor Aluminum bei nur 201g."
                  : "Samsung's thinnest and lightest foldable to date. 7.6-inch Dynamic LTPO AMOLED 2X, 5.5-inch cover screen, Snapdragon 8 Elite Gen 5 silicon and Armor Aluminum build at just 201g.")
                : (isDe
                  ? "Kompromisslose Produktivität. 8,0-Zoll Riesen-Canvas mit S-Pen Digitizer, 200 MP ISOCELL Hauptkamera mit 5x Periskop-Telezoom, Grade 5 Titanrahmen und 5.000 mAh Akku."
                  : "Uncompromising powerhouse. Expansive 8.0-inch canvas with S-Pen digitizer, 200MP ISOCELL main camera with 5x periscope telephoto, Grade 5 titanium chassis and 5,000 mAh battery.")}
            </p>

            {/* Direct Consultation CTAs */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-xs sm:text-sm font-semibold transition-all hover:bg-gold hover:text-black shadow-md"
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
                <span className="text-gold" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Model Segmented Controller */}
      <section className="sticky top-14 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md py-3">
        <div className="container-page flex items-center justify-center">
          <div className="inline-flex p-1 rounded-full border border-border bg-surface/80">
            <Link
              href={`/${locale}/galaxy-z-fold-8`}
              onClick={() => handleSelectModel("fold8")}
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                selectedModel === "fold8"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Galaxy Z Fold8 (4,5 mm)
            </Link>
            <Link
              href={`/${locale}/galaxy-z-fold-8-ultra`}
              onClick={() => handleSelectModel("ultra")}
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                selectedModel === "ultra"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {isDe ? "Galaxy Z Fold8 Ultra (8 Zoll 200MP)" : "Galaxy Z Fold8 Ultra (8-Inch 200MP)"}
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Media & Design Showcase Gallery */}
      <section className="py-12 md:py-16">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl text-foreground">
                {isDe ? "Design & Farbvarianten" : "Design & Color Finishes"}
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                {isDe ? "Offizielle Renderings & Design-Video im Detail" : "Official product renders and design video"}
              </p>
            </div>

            {/* Media Tabs */}
            <div className="inline-flex rounded-xl border border-border bg-surface p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveMediaTab("video")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                  activeMediaTab === "video" ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
              >
                <PlayIcon className="size-3.5" />
                <span>{isDe ? "Design-Video" : "Design Video"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab("colors")}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  activeMediaTab === "colors" ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
              >
                <span>{isDe ? "Farben (360°)" : "Colors (360°)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMediaTab("dual")}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  activeMediaTab === "dual" ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                }`}
              >
                <span>{isDe ? "Lineup" : "Lineup"}</span>
              </button>
            </div>
          </div>

          {/* Main Visual Stage */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-strong/40 p-4 sm:p-8 flex items-center justify-center min-h-[420px] md:min-h-[520px]">
            {/* Tab 1: Video View */}
            {activeMediaTab === "video" && (
              <div className="relative w-full max-w-4xl aspect-[16/9] overflow-hidden rounded-xl bg-black border border-border shadow-2xl">
                <video
                  ref={videoRef}
                  src="/images/samsung/zfold8/galaxy-z-fold8-design.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Tab 2: Color Switcher Stage */}
            {activeMediaTab === "colors" && (
              <div className="flex flex-col items-center justify-center text-center space-y-6 w-full max-w-xl">
                <div className="relative w-full max-w-sm aspect-[3/4] transition-all duration-300">
                  <Image
                    key={currentFinish.src}
                    src={currentFinish.src}
                    alt={`Samsung Galaxy ${selectedModel === "fold8" ? "Z Fold8" : "Z Fold8 Ultra"} — ${
                      isDe ? currentFinish.nameDe : currentFinish.nameEn
                    }`}
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-foreground">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: currentFinish.colorHex }} />
                    <span>{isDe ? currentFinish.nameDe : currentFinish.nameEn}</span>
                  </div>

                  <div className="flex items-center justify-center gap-3" role="group" aria-label="Color Selection">
                    {activeFinishes.map((finish, idx) => (
                      <button
                        key={finish.id}
                        type="button"
                        onClick={() => setSelectedFinishIndex(idx)}
                        className={`size-8 rounded-full border-2 transition-all ${
                          idx === selectedFinishIndex
                            ? "border-gold scale-110 shadow-lg shadow-gold/30"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: finish.colorHex }}
                        title={isDe ? finish.nameDe : finish.nameEn}
                        aria-label={isDe ? finish.nameDe : finish.nameEn}
                        aria-pressed={idx === selectedFinishIndex}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Dual Lineup Stage */}
            {activeMediaTab === "dual" && (
              <div className="relative w-full max-w-3xl aspect-[16/10]">
                <Image
                  src="/images/samsung/zfold8/banner-dual-desktop.webp"
                  alt="Samsung Galaxy Z Fold8 & Z Fold8 Ultra Lineup"
                  fill
                  className="object-contain drop-shadow-2xl rounded-xl"
                />
              </div>
            )}

            {/* Expand / Lightbox Trigger */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-md transition hover:border-gold"
              aria-label={isDe ? "Vollbildansicht öffnen" : "Open fullscreen lightbox"}
            >
              <ExpandIcon className="size-3.5" />
              <span>{isDe ? "Vollbild" : "Fullscreen"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Technical Specifications Matrix */}
      <section className="border-t border-border/80 bg-surface/30 py-16">
        <div className="container-page">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              {isDe ? "Direkter Vergleich" : "Direct Comparison"}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {isDe ? "Technische Spezifikationen im Detail" : "Technical Specifications in Detail"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {isDe ? "Verifizierte GSMArena & Samsung Hersteller-Daten" : "Verified GSMArena and Samsung manufacturer data"}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-strong/60">
                  <th className="p-4 font-semibold text-muted w-1/3">
                    {isDe ? "Kategorie" : "Specification"}
                  </th>
                  <th className={`p-4 font-bold w-1/3 ${selectedModel === "fold8" ? "text-gold bg-gold/5" : "text-foreground"}`}>
                    Galaxy Z Fold8 (4,5 mm)
                  </th>
                  <th className={`p-4 font-bold w-1/3 ${selectedModel === "ultra" ? "text-gold bg-gold/5" : "text-foreground"}`}>
                    {isDe ? "Galaxy Z Fold8 Ultra (8 Zoll 200MP)" : "Galaxy Z Fold8 Ultra (8-Inch 200MP)"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {specRows.map((row) => (
                  <tr key={row.category} className="transition-colors hover:bg-surface/50">
                    <td className="p-4 font-medium text-muted">{row.category}</td>
                    <td className={`p-4 leading-relaxed ${selectedModel === "fold8" ? "bg-gold/5 font-medium text-foreground" : "text-muted"}`}>
                      {row.fold8}
                    </td>
                    <td className={`p-4 leading-relaxed ${selectedModel === "ultra" ? "bg-gold/5 font-medium text-foreground" : "text-muted"}`}>
                      {row.ultra}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4 Feature Deep Dives */}
      <section className="py-16">
        <div className="container-page">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {isDe ? "Die 4 Schlüssel-Innovationen der Z Fold8 Serie" : "The 4 Key Innovations of the Z Fold8 Series"}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="size-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isDe ? "Zero-Gap Scharnier" : "Zero-Gap Hinge"}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isDe
                  ? "Der neue Flex Teardrop Mechanismus schließt völlig plan und reduziert die Displayfalte auf ein absolutes Minimum."
                  : "The redesigned Flex Teardrop mechanism closes completely flat and minimizes the screen crease to an absolute minimum."}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="size-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-foreground">
                Snapdragon 8 Elite Gen 5
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isDe
                  ? "Gefertigt im modernsten 3nm-Verfahren für bahnbrechende Energieeffizienz und On-Device Galaxy AI Funktionen."
                  : "Fabricated on state-of-the-art 3nm silicon for industry-leading efficiency and on-device Galaxy AI capabilities."}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="size-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isDe ? "200 MP ISOCELL Optik" : "200MP ISOCELL Optics"}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isDe
                  ? "Das Fold8 Ultra bringt Samsungs 200 MP Kamerasensor erstmals in ein Foldable — inklusive 5x Periskop-Telezoom."
                  : "Fold8 Ultra introduces Samsung's 200MP sensor to a foldable for the first time — complete with 5x periscope optical zoom."}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
              <div className="size-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isDe ? "Desktop DeX Multitasking" : "Desktop DeX Multitasking"}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isDe
                  ? "Bis zu drei Apps gleichzeitig im Multi-Active Window und drahtlose PC-Verbindung via Samsung DeX für vollwertiges Arbeiten."
                  : "Up to three simultaneous apps in Multi-Active Window and wireless PC connection via Samsung DeX for workstation productivity."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hamburg Boutique Confidence & Trade-In */}
      <section className="border-t border-border/70 bg-surface/40 py-14">
        <div className="container-page">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gold">
                {isDe ? "Vertragsfrei" : "Unlocked"}
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isDe ? "100% ohne SIM-Lock" : "100% Factory Unlocked"}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isDe
                  ? "Sofort einsatzbereit mit jeder SIM-Karte und jedem Anbieter. Unterstützt Dual-SIM und flexible eSIM-Profile."
                  : "Ready for immediate use with any carrier worldwide. Supports Dual-SIM and flexible eSIM profiles."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gold">
                {isDe ? "Sicherheit" : "Warranty"}
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isDe ? "24 Monate Gewährleistung" : "24 Months Warranty"}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isDe
                  ? "Kauf mit voller Sicherheit vom Hamburger Fachhändler. Auf Wunsch mit bequemer Abholung im Store Wilhelmsburg."
                  : "Purchase with complete confidence from a licensed Hamburg retailer, with in-store collection or express delivery."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gold">
                {isDe ? "Inzahlungnahme" : "Trade-In"}
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isDe ? "Altgerät sofort anrechnen" : "Instant Trade-In Credit"}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isDe
                  ? "Geben Sie Ihr bisheriges iPhone oder Galaxy Gerät in Zahlung und sichern Sie sich direkten Preisnachlass."
                  : "Trade in your current iPhone or Galaxy smartphone for an immediate valuation credit toward your new Fold8."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 border-t border-border/80">
        <div className="container-page max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {isDe ? "Häufig gestellte Fragen" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-xl border border-border bg-surface overflow-hidden transition">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-foreground hover:text-gold transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{isDe ? faq.qDe : faq.qEn}</span>
                    <ChevronDownIcon
                      className={`size-4 text-muted transition-transform duration-200 ${isOpen ? "rotate-180 text-gold" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-muted leading-relaxed border-t border-border/40 pt-3">
                      {isDe ? faq.aDe : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={isDe ? "Vollbildansicht" : "Fullscreen View"}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            aria-label={isDe ? "Schließen" : "Close"}
          >
            <CloseIcon className="size-5" />
          </button>

          <div className="relative w-full max-w-4xl max-h-[85vh] aspect-[4/3]">
            {activeMediaTab === "video" ? (
              <video
                src="/images/samsung/zfold8/galaxy-z-fold8-design.mp4"
                autoPlay
                controls
                className="w-full h-full object-contain rounded-xl"
              />
            ) : activeMediaTab === "dual" ? (
              <Image
                src="/images/samsung/zfold8/banner-dual-desktop.webp"
                alt="Samsung Galaxy Z Fold8 & Z Fold8 Ultra"
                fill
                className="object-contain"
              />
            ) : (
              <Image
                src={currentFinish.src}
                alt={`Samsung Galaxy ${selectedModel === "fold8" ? "Z Fold8" : "Z Fold8 Ultra"} — ${
                  isDe ? currentFinish.nameDe : currentFinish.nameEn
                }`}
                fill
                className="object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
