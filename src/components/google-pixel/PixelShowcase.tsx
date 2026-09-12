"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { siteInfo } from "@/lib/site";
import s from "./PixelShowcase.module.css";

export type PixelModelId = "pixel11" | "proFold";

export type PixelShowcaseProps = {
  locale: Locale;
  initialModel?: PixelModelId;
};

type Finish = {
  id: string;
  nameDe: string;
  nameEn: string;
  colorHex: string;
  /** Primary official product render. */
  primary: string;
  /** Secondary official render (back / detail / lifestyle). */
  detail: string;
  badgeDe: string;
  badgeEn: string;
};

type VideoTrack = {
  src: string;
  nameDe: string;
  nameEn: string;
};

const OFFICIAL = "/images/google/pixel11/official";
const VIDEOS = "/images/google/pixel11/videos";

const PIXEL11_FINISHES: Finish[] = [
  {
    id: "frost",
    nameDe: "Frost",
    nameEn: "Frost",
    colorHex: "#e9e6df",
    primary: `${OFFICIAL}/pixel11-frost-back.jpg`,
    detail: `${OFFICIAL}/pixel11-frost-person.jpg`,
    badgeDe: "Kühles Mattweiß",
    badgeEn: "Cool Matte White",
  },
  {
    id: "hibiscus",
    nameDe: "Hibiscus",
    nameEn: "Hibiscus",
    colorHex: "#e5a3b5",
    primary: `${OFFICIAL}/pixel11-hibiscus-back.jpg`,
    detail: `${OFFICIAL}/pixel11-hibiscus-person.jpg`,
    badgeDe: "Kräftiges Pink 2026",
    badgeEn: "Vivid Pink 2026",
  },
  {
    id: "pistachio",
    nameDe: "Pistachio",
    nameEn: "Pistachio",
    colorHex: "#b9d9a8",
    primary: `${OFFICIAL}/pixel11-pistachio-back.jpg`,
    detail: `${OFFICIAL}/pixel11-pistachio-person.jpg`,
    badgeDe: "Frisches Grün",
    badgeEn: "Fresh Green",
  },
  {
    id: "obsidian",
    nameDe: "Obsidian",
    nameEn: "Obsidian",
    colorHex: "#2b2c2e",
    primary: `${OFFICIAL}/pixel11-obsidian-back.jpg`,
    detail: `${OFFICIAL}/pixel11-obsidian-person.jpg`,
    badgeDe: "Tiefes Vulkanglas-Schwarz",
    badgeEn: "Deep Volcanic Black",
  },
];

const FOLD_FINISHES: Finish[] = [
  {
    id: "olive",
    nameDe: "Olive",
    nameEn: "Olive",
    colorHex: "#9a9a6e",
    primary: `${OFFICIAL}/fold-olive-back.jpg`,
    detail: `${OFFICIAL}/fold-olive-open.jpg`,
    badgeDe: "Signature Edition",
    badgeEn: "Signature Edition",
  },
  {
    id: "obsidian",
    nameDe: "Obsidian",
    nameEn: "Obsidian",
    colorHex: "#2b2c2e",
    primary: `${OFFICIAL}/fold-obsidian-back.jpg`,
    detail: `${OFFICIAL}/fold-obsidian-open.jpg`,
    badgeDe: "Satiniertes Glas & Stahl",
    badgeEn: "Satin Glass & Steel",
  },
];

const PIXEL11_VIDEOS: VideoTrack[] = [
  { src: `${VIDEOS}/pixel11-hero.mp4`, nameDe: "Pixel 11 Design-Film", nameEn: "Pixel 11 Design Film" },
  { src: `${VIDEOS}/pixel11-colors.mp4`, nameDe: "Alle Farben", nameEn: "All Finishes" },
  { src: `${VIDEOS}/pixel11-gemini.mp4`, nameDe: "Gemini AI", nameEn: "Gemini AI" },
];

const FOLD_VIDEOS: VideoTrack[] = [
  { src: `${VIDEOS}/fold-hero.mp4`, nameDe: "Pro Fold Design-Film", nameEn: "Pro Fold Design Film" },
  { src: `${VIDEOS}/fold-colors.mp4`, nameDe: "Alle Farben", nameEn: "All Finishes" },
];

const GALLERY: Record<PixelModelId, { src: string; altDe: string; altEn: string }[]> = {
  pixel11: [
    { src: `${OFFICIAL}/pixel11-camera.jpg`, altDe: "Nahaufnahme der Google Pixel 11 Kameraleiste.", altEn: "Close-up of the Google Pixel 11 camera bar." },
    { src: `${OFFICIAL}/pixel11-display.jpg`, altDe: "Das brillante Actua OLED Display des Pixel 11.", altEn: "The brilliant Actua OLED display of Pixel 11." },
    { src: `${OFFICIAL}/pixel11-duo.jpg`, altDe: "Google Pixel 11 in mehreren Farben nebeneinander.", altEn: "Google Pixel 11 in multiple finishes side by side." },
  ],
  proFold: [
    { src: `${OFFICIAL}/fold-side.jpg`, altDe: "Seitenansicht des zusammengeklappten Pixel 11 Pro Fold.", altEn: "Side view of the folded Pixel 11 Pro Fold." },
    { src: `${OFFICIAL}/fold-olive-open.jpg`, altDe: "Aufgeklapptes Pixel 11 Pro Fold in Olive.", altEn: "Unfolded Pixel 11 Pro Fold in Olive." },
    { src: `${OFFICIAL}/fold-olive-edge.jpg`, altDe: "Mattes, platinfarbenes Metallgehäuse des Pro Fold.", altEn: "Matte platinum metal frame of the Pro Fold." },
  ],
};

/* -------------------------------------------------------------------------- */
/* Clean SVG Icons (Zero Emojis)                                             */
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

function ChevronDownIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Hardware Architecture SVGs                                                 */
/* -------------------------------------------------------------------------- */

function GoogleTensorCpuSvg({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="12" y="12" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="2" />
      <rect x="19" y="19" width="10" height="10" rx="2.5" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.5" />
      {[16, 22, 28, 34].map((v) => (
        <g key={v} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
          <line x1={v} y1="6" x2={v} y2="12" />
          <line x1={v} y1="36" x2={v} y2="42" />
          <line x1="6" y1={v} x2="12" y2={v} />
          <line x1="36" y1={v} x2="42" y2={v} />
        </g>
      ))}
    </svg>
  );
}

function PixelPeriscopeCameraSvg({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="5" y="16" width="26" height="16" rx="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="24" r="5.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="24" r="1.8" fill="currentColor" />
      <path d="M35 20.5 L43 18.5 L43 29.5 L35 27.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M35 24 L39.5 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function PixelFrictionHingeSvg({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="6" y="9" width="17" height="30" rx="4" stroke="currentColor" strokeWidth="2" />
      <rect x="25" y="9" width="17" height="30" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="1.7" fill="currentColor" />
    </svg>
  );
}

function SuperActuaDisplaySvg({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="12" y="6" width="24" height="36" rx="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="5.5" stroke="currentColor" strokeWidth="1.6" opacity="0.75" />
      <path
        d="M24 14.5v2M24 31.5v2M14.5 24h2M31.5 24h2M17.3 17.3l1.4 1.4M29.3 29.3l1.4 1.4M30.7 17.3l-1.4 1.4M18.7 29.3l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* PixelShowcase Component                                                    */
/* -------------------------------------------------------------------------- */

const ARCH_ACCENTS = {
  blue: {
    icon: "bg-blue/10 text-blue ring-blue/20",
    tag: "border-blue/25 bg-blue/10 text-blue",
    text: "text-blue",
    hover: "hover:border-blue/40",
    glow: "bg-blue/20",
  },
  gold: {
    icon: "bg-gold/10 text-gold ring-gold/20",
    tag: "border-gold/25 bg-gold/10 text-gold",
    text: "text-gold",
    hover: "hover:border-gold/40",
    glow: "bg-gold/20",
  },
  green: {
    icon: "bg-green/10 text-green ring-green/20",
    tag: "border-green/25 bg-green/10 text-green",
    text: "text-green",
    hover: "hover:border-green/40",
    glow: "bg-green/20",
  },
} as const;

export default function PixelShowcase({
  locale,
  initialModel = "pixel11",
}: PixelShowcaseProps) {
  const isDe = locale === "de";
  const [, startTransition] = useTransition();

  const [selectedModel, setSelectedModel] = useState<PixelModelId>(initialModel);
  const [selectedFinishIndex, setSelectedFinishIndex] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const activeFinishes = selectedModel === "pixel11" ? PIXEL11_FINISHES : FOLD_FINISHES;
  const currentFinish = activeFinishes[selectedFinishIndex] || activeFinishes[0];
  const modelVideos = selectedModel === "pixel11" ? PIXEL11_VIDEOS : FOLD_VIDEOS;
  const currentVideo = modelVideos[Math.min(activeVideoIdx, modelVideos.length - 1)];

  const handleSelectModel = (model: PixelModelId) => {
    startTransition(() => {
      setSelectedModel(model);
      setSelectedFinishIndex(0);
      setActiveVideoIdx(0);
    });
  };

  // WhatsApp link
  const waText = encodeURIComponent(
    isDe
      ? `Guten Tag Apfel Park Team, ich interessiere mich für das Google ${
          selectedModel === "pixel11"
            ? "Pixel 11 (Tensor G6)"
            : "Pixel 11 Pro Fold (8 Zoll Super Actua Flex)"
        } in der Farbe ${currentFinish.nameDe}. Bitte senden Sie mir ein Angebot und Infos zur Verfügbarkeit in Hamburg.`
      : `Hello Apfel Park Team, I am inquiring about the Google ${
          selectedModel === "pixel11"
            ? "Pixel 11 (Tensor G6)"
            : "Pixel 11 Pro Fold (8-Inch Super Actua Flex)"
        } in ${currentFinish.nameEn}. Please share price, availability, and collection details in Hamburg.`
  );
  const whatsappUrl = `https://wa.me/${siteInfo.whatsapp}?text=${waText}`;

  // Email link
  const emailSubject = encodeURIComponent(
    isDe
      ? `Anfrage: Google ${selectedModel === "pixel11" ? "Pixel 11" : "Pixel 11 Pro Fold"}`
      : `Inquiry: Google ${selectedModel === "pixel11" ? "Pixel 11" : "Pixel 11 Pro Fold"}`
  );
  const emailUrl = `mailto:${siteInfo.email}?subject=${emailSubject}`;

  // Tech Specs comparison table
  const specRows = [
    { category: isDe ? "Maße & Gewicht" : "Dimensions & weight", pixel11: isDe ? "152,8 × 72 × 8,6 mm · 197 g" : "152.8 × 72 × 8.6 mm · 197 g", proFold: isDe ? "5,0 mm geöffnet · 10,1 mm geschlossen · 239 g" : "5.0 mm open · 10.1 mm closed · 239 g" },
    { category: isDe ? "Hauptdisplay" : "Main display", pixel11: isDe ? "6,3\" OLED · 60–120 Hz · bis 3.000 Nits" : "6.3\" OLED · 60–120 Hz · up to 3,000 nits", proFold: isDe ? "8\" Super Actua Flex OLED · 1–120 Hz · bis 3.600 Nits" : "8\" Super Actua Flex OLED · 1–120 Hz · up to 3,600 nits" },
    { category: isDe ? "Außendisplay" : "Outer display", pixel11: isDe ? "6,3\" Hauptdisplay" : "6.3\" main display", proFold: isDe ? "6,5\" Super Actua OLED · 1–120 Hz" : "6.5\" Super Actua OLED · 1–120 Hz" },
    { category: isDe ? "Prozessor" : "Processor", pixel11: isDe ? "Google Tensor G6 · Titan M3" : "Google Tensor G6 · Titan M3", proFold: isDe ? "Google Tensor G6 · Titan M3" : "Google Tensor G6 · Titan M3" },
    { category: isDe ? "Rückkameras" : "Rear cameras", pixel11: isDe ? "48 MP Weitwinkel · 13 MP Ultraweitwinkel · 10,8 MP Tele (5x)" : "48 MP wide · 13 MP ultrawide · 10.8 MP telephoto (5x)", proFold: isDe ? "48 MP Weitwinkel · 10,5 MP Ultraweitwinkel · 10,8 MP Tele (5x)" : "48 MP wide · 10.5 MP ultrawide · 10.8 MP telephoto (5x)" },
    { category: isDe ? "Arbeitsspeicher & Kapazitäten" : "Memory & capacities", pixel11: isDe ? "12 GB RAM · 256 / 512 GB" : "12 GB RAM · 256 / 512 GB", proFold: isDe ? "16 GB RAM · 256 / 512 GB / 1 TB" : "16 GB RAM · 256 / 512 GB / 1 TB" },
    { category: isDe ? "Akku" : "Battery", pixel11: isDe ? "4.985 mAh typisch · Ladezubehör separat" : "4,985 mAh typical · charging accessories separate", proFold: isDe ? "4.806 mAh typisch · Ladezubehör separat" : "4,806 mAh typical · charging accessories separate" },
    { category: isDe ? "Updates & Schutz" : "Updates & protection", pixel11: isDe ? "7 Jahre Updates ab Markteinführung · IP68 ab Werk" : "7 years of updates from launch · IP68 when new", proFold: isDe ? "7 Jahre Updates ab Markteinführung · IP68 ab Werk" : "7 years of updates from launch · IP68 when new" },
  ];
  // FAQ list
  const faqs = [
    {
      qDe: "Wann sind Google Pixel 11 und Pixel 11 Pro Fold in Deutschland erhältlich?",
      qEn: "When are Google Pixel 11 and Pixel 11 Pro Fold available in Germany?",
      aDe: "Bitte frage die gewünschte Ausführung unverbindlich an. Wir bestätigen Preis, Gerätezustand, Bestand und Liefertermin individuell. Diese Modellvorstellung ist keine Bestandszusage.",
      aEn: "Ask about your preferred configuration without obligation. We confirm price, condition, stock and delivery date individually. This showcase is not a stock guarantee.",
    },
    {
      qDe: "Was zeichnet den neuen Google Tensor G6 Prozessor aus?",
      qEn: "What makes the new Google Tensor G6 processor special?",
      aDe: "Google nennt für beide Modelle Tensor G6 und den Sicherheitschip Titan M3. KI-Funktionen hängen von Sprache, Region, Konto und Verbindung ab.",
      aEn: "Google lists Tensor G6 and the Titan M3 security chip for both models. AI features depend on language, region, account and connectivity.",
    },
    {
      qDe: "Welche Farbvarianten sind für Google Pixel 11 erhältlich?",
      qEn: "Which color finishes are available for Google Pixel 11?",
      aDe: "Google nennt Frost, Hibiscus, Pistachio und Obsidian für Pixel 11 sowie Olive und Obsidian für Pro Fold. Die Verfügbarkeit bei Apfel Park bitte anfragen.",
      aEn: "Google lists Frost, Hibiscus, Pistachio and Obsidian for Pixel 11, and Olive and Obsidian for Pro Fold. Ask about availability at Apfel Park.",
    },
    {
      qDe: "Wie lange garantiert Google Software- und Sicherheitsupdates?",
      qEn: "How long does Google guarantee software and security updates?",
      aDe: "Google nennt sieben Jahre Betriebssystem-, Sicherheits- und Pixel-Drop-Updates ab der ersten Verfügbarkeit im Google Store in den USA, nicht ab deinem Kaufdatum.",
      aEn: "Google lists seven years of OS, security and Pixel Drop updates from first availability in the US Google Store, not from your purchase date.",
    },
  ];

  const architectureCards = [
    {
      key: "tensor",
      accent: ARCH_ACCENTS.blue,
      Icon: GoogleTensorCpuSvg,
      tag: "Tensor & Titan",
      title: "Google Tensor G6",
      highlight: "Custom TPU · Titan M3 Enclave",
      body: isDe
        ? "Tensor G6 und Titan M3 bilden die Rechen- und Sicherheitsplattform. Einzelne KI-Funktionen benötigen eine Internetverbindung und ein passendes Konto."
        : "Tensor G6 and Titan M3 provide processing and security. Some AI features require an internet connection and a compatible account.",
      statLabel: isDe ? "KI-Engine" : "AI Engine",
      statValue: "Gemini",
    },
    {
      key: "camera",
      accent: ARCH_ACCENTS.gold,
      Icon: PixelPeriscopeCameraSvg,
      tag: "48 MP · 5x Tele",
      title: isDe ? "Pro Pixel Kamerasystem" : "Pro Pixel Camera Suite",
      highlight: "Quad PD · 5x Tele",
      body: isDe
        ? "Beide Modelle kombinieren eine 48-MP-Hauptkamera mit Ultraweitwinkel und 5-fachem Teleobjektiv. Die Ultraweitwinkelauflösung unterscheidet sich je nach Modell."
        : "Both models combine a 48 MP main camera, ultrawide camera and 5x telephoto. Ultrawide resolution differs between models.",
      statLabel: isDe ? "Optischer Zoom" : "Optical Zoom",
      statValue: "5x Periskop + OIS",
    },
    {
      key: "hinge",
      accent: ARCH_ACCENTS.green,
      Icon: PixelFrictionHingeSvg,
      tag: isDe ? "Pro Fold" : "Pro Fold",
      title: isDe ? "Faltbares Design" : "Foldable design",
      highlight: isDe ? "Stahllegierung · IP68 ab Werk" : "Steel alloy · IP68 when new",
      body: isDe
        ? "Das Pro Fold nutzt ein Scharnier aus mehreren Stahllegierungen mit einer Aluminiumabdeckung. Der Schutz vor Wasser und Staub ist nicht dauerhaft."
        : "Pro Fold uses a multi-alloy steel hinge with an aluminium alloy cover. Water and dust resistance are not permanent.",
      statLabel: isDe ? "Wasserfestigkeit" : "Water Resistance",
      statValue: "IP68",
    },
    {
      key: "display",
      accent: ARCH_ACCENTS.blue,
      Icon: SuperActuaDisplaySvg,
      tag: "Pro Fold · LTPO",
      title: "Pro Fold: Super Actua Flex OLED",
      highlight: isDe ? "1-120 Hz variabel · UTG Glas" : "1-120 Hz variable · UTG glass",
      body: isDe
        ? "Kristallklares OLED-Display mit adaptiver Bildwiederholrate von 1 Hz bis 120 Hz und reflexionsarmer Beschichtung. Die Helligkeitswerte sind Hersteller-Laborwerte."
        : "Ultra-bright OLED canvas featuring dynamic refresh scaling from 1Hz to 120Hz and anti-reflective polarization. Brightness figures are manufacturer laboratory measurements.",
      statLabel: isDe ? "Spitzenhelligkeit" : "Peak Brightness",
      statValue: "bis / up to 3.600 Nits",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-gold selection:text-black">
      {/* Sub-Navigation & Breadcrumbs */}
      <div className="border-b border-border/70 bg-surface/40 py-2.5 backdrop-blur-sm">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 text-xs">
          <nav className="flex items-center gap-2 text-muted" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-gold transition-colors">
              {isDe ? "Startseite" : "Home"}
            </Link>
            <span className="text-border">/</span>
            <Link href={`/${locale}/store`} className="hover:text-gold transition-colors">
              Store
            </Link>
            <span className="text-border">/</span>
            <Link href={`/${locale}/smartphones`} className="hover:text-gold transition-colors">
              Google Pixel
            </Link>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">
              {selectedModel === "pixel11" ? "Pixel 11" : "Pixel 11 Pro Fold"}
            </span>
          </nav>

          <div className="flex items-center gap-2 text-muted">
            <span className="size-1.5 rounded-full bg-blue" />
            <span>{isDe ? "Hamburg Boutique & bundesweiter Versand" : "Hamburg Boutique & Nationwide Shipping"}</span>
          </div>
        </div>
      </div>

      {/* Hero Header (Clean editorial design — zero embedded banners) */}
      <header className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-surface/80 via-background to-background pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="container-page relative z-10 text-center">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue/40 bg-blue/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-blue uppercase">
              <span>{isDe ? "Google Flaggschiff Innovation 2026" : "Google Flagship Innovation 2026"}</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl font-sans text-balance">
              {selectedModel === "pixel11" ? (
                <>
                  Google Pixel 11
                  <span className="block text-xl sm:text-3xl lg:text-4xl font-medium text-muted mt-2">
                    {isDe ? "Dein Alltag. Neu gedacht mit Tensor G6." : "Everyday Magic. Reimagined with Tensor G6."}
                  </span>
                </>
              ) : (
                <>
                  Pixel 11 Pro Fold
                  <span className="block text-xl sm:text-3xl lg:text-4xl font-medium text-muted mt-2">
                    {isDe ? "8,0-Zoll Super Actua Flex & 5,0 mm Slim." : "8.0-Inch Super Actua Flex & Record 5.0mm Slim."}
                  </span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-muted leading-relaxed text-balance">
              {selectedModel === "pixel11"
                ? (isDe
                  ? "Google Pixel 11 mit Tensor G6, 6,3-Zoll-OLED und drei Rückkameras. Konfiguration und Verfügbarkeit bei Apfel Park bitte anfragen."
                  : "Google Pixel 11 with Tensor G6, a 6.3-inch OLED and three rear cameras. Ask Apfel Park to confirm configuration and availability.")
                : (isDe
                  ? "Pixel 11 Pro Fold mit 8-Zoll-Innendisplay, 6,5-Zoll-Außendisplay, Tensor G6 und drei Rückkameras. Preis und Verfügbarkeit bitte anfragen."
                  : "Pixel 11 Pro Fold with an 8-inch inner display, 6.5-inch cover display, Tensor G6 and three rear cameras. Ask about price and availability.")}
            </p>

            {/* Direct Consultation CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-xs sm:text-sm font-semibold transition-all hover:bg-gold hover:text-black shadow-md min-h-[44px]"
              >
                <WhatsAppIcon className="size-4" />
                <span>{isDe ? "Angebot via WhatsApp anfragen" : "Request Quote via WhatsApp"}</span>
              </a>

              <a
                href={emailUrl}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-gold hover:text-gold min-h-[44px]"
              >
                <MailIcon className="size-4" />
                <span>{isDe ? "Per E-Mail anfragen" : "Request Quote via Email"}</span>
              </a>

              <Link
                href={`/${locale}/repairs`}
                className="inline-flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-medium text-muted hover:text-foreground transition-colors min-h-[44px]"
              >
                <span>{isDe ? "Altgerät in Zahlung geben" : "Trade in current device"}</span>
                <span className="text-gold" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Model Segmented Controller */}
      <section className="sticky top-[var(--site-header-h,4.5rem)] z-20 border-b border-border/80 bg-background/90 backdrop-blur-md py-3">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface/80 p-1 sm:mx-auto sm:flex sm:w-auto sm:rounded-full">
            <button
              type="button"
              onClick={() => handleSelectModel("pixel11")}
              className={`min-h-[44px] rounded-xl px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all sm:min-h-[38px] sm:whitespace-nowrap sm:rounded-full sm:px-6 sm:py-1.5 sm:text-sm ${
                selectedModel === "pixel11"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              aria-pressed={selectedModel === "pixel11"}
            >
              Google Pixel 11 (6,3&quot;)
            </button>
            <button
              type="button"
              onClick={() => handleSelectModel("proFold")}
              className={`min-h-[44px] rounded-xl px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all sm:min-h-[38px] sm:whitespace-nowrap sm:rounded-full sm:px-6 sm:py-1.5 sm:text-sm ${
                selectedModel === "proFold"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              aria-pressed={selectedModel === "proFold"}
            >
              {isDe ? "Pixel 11 Pro Fold (8 Zoll)" : "Pixel 11 Pro Fold (8-Inch)"}
            </button>
          </div>
        </div>
      </section>

      {/* Finish Studio */}
      <section className="py-14 md:py-20">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue">
              {isDe ? "Design & Farben" : "Design & Finishes"}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
              {selectedModel === "pixel11"
                ? isDe ? "Vier Farben. Ein Statement." : "Four finishes. One statement."
                : isDe ? "Gefaltet wie nie zuvor." : "Folding like never before."}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
              {selectedModel === "pixel11"
                ? isDe
                  ? "Von Frost über Hibiscus und Pistachio bis Obsidian – jede Variante mit satiniertem Finish und polierten Aluminiumkanten."
                  : "From Frost to Hibiscus, Pistachio and Obsidian – each finish with a satin back and polished aluminium edges."
                : isDe
                  ? "Olive und Obsidian, 5,0 mm geöffnet und 10,1 mm geschlossen. Die Verfügbarkeit der Ausführung bitte anfragen."
                  : "Olive and Obsidian, 5.0 mm open and 10.1 mm closed. Ask about availability of your preferred configuration."}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-surface-strong/80 via-surface to-background p-6 sm:p-10">
                <div
                  className={s.ambientBackdrop}
                  style={{ backgroundColor: currentFinish.colorHex }}
                  aria-hidden="true"
                />
                <div className="relative z-10 mx-auto h-[360px] sm:h-[500px]">
                  <Image
                    key={`${selectedModel}-${currentFinish.id}`}
                    src={currentFinish.primary}
                    alt={`Google ${selectedModel === "pixel11" ? "Pixel 11" : "Pixel 11 Pro Fold"} – ${isDe ? currentFinish.nameDe : currentFinish.nameEn}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.35)] transition-all duration-500"
                    priority
                  />
                </div>
                <span className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md">
                  <span className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: currentFinish.colorHex }} />
                  {isDe ? currentFinish.nameDe : currentFinish.nameEn}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2.5" role="radiogroup" aria-label={isDe ? "Farbe wählen" : "Choose finish"}>
                {activeFinishes.map((finish, idx) => {
                  const isActive = idx === selectedFinishIndex;
                  return (
                    <button
                      key={finish.id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setSelectedFinishIndex(idx)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                        isActive ? "border-blue bg-blue/5 shadow-sm" : "border-border hover:border-blue/50 hover:bg-surface/60"
                      }`}
                    >
                      <span className="size-9 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: finish.colorHex }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">{isDe ? finish.nameDe : finish.nameEn}</span>
                        <span className="block text-xs text-muted">{isDe ? finish.badgeDe : finish.badgeEn}</span>
                      </span>
                      {isActive && (
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue text-white">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs sm:text-sm font-semibold text-background transition-all hover:bg-gold hover:text-black shadow-md min-h-[44px]"
                >
                  <WhatsAppIcon className="size-4" />
                  <span>{isDe ? "Angebot anfragen" : "Request a quote"}</span>
                </a>
                <a
                  href={emailUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-gold hover:text-gold min-h-[44px]"
                >
                  <MailIcon className="size-4" />
                  <span>{isDe ? "Per E-Mail" : "By email"}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official design films */}
      <section className="border-t border-border/70 bg-surface/20 py-14 md:py-20">
        <div className="container-page">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue">
                {isDe ? "Offizielle Design-Filme" : "Official Design Films"}
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
                {isDe ? "Bewegt. In voller Auflösung." : "In motion. In full resolution."}
              </h2>
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-background p-1 text-xs">
              {modelVideos.map((track, idx) => (
                <button
                  key={track.src}
                  type="button"
                  onClick={() => setActiveVideoIdx(idx)}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-all min-h-[36px] ${
                    idx === activeVideoIdx ? "bg-blue text-white shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  {isDe ? track.nameDe : track.nameEn}
                </button>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border bg-black shadow-2xl">
            <video
              ref={videoRef}
              key={currentVideo.src}
              src={currentVideo.src}
              autoPlay
              muted
              loop
              playsInline
              controls
              className="aspect-video w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-5 sm:p-6">
              <span className="text-sm font-semibold text-white sm:text-base">
                {isDe ? currentVideo.nameDe : currentVideo.nameEn}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Official Google imagery gallery */}
      <section className="border-t border-border/80 bg-surface/20 py-14 md:py-20">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue">
              {isDe ? "Offizielle Google Motive" : "Official Google Imagery"}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {selectedModel === "pixel11"
                ? isDe
                  ? "Pixel 11 in herausragenden Details"
                  : "Pixel 11 in extraordinary detail"
                : isDe
                  ? "Pixel 11 Pro Fold in herausragenden Details"
                  : "Pixel 11 Pro Fold in extraordinary detail"}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY[selectedModel].map((item) => (
              <figure
                key={item.src}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-strong/40"
              >
                <Image
                  src={item.src}
                  alt={isDe ? item.altDe : item.altEn}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Silicon & Engineering Hardware Architecture */}
      <section className="relative overflow-hidden border-t border-border/80 bg-surface/20 py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue/25 bg-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue">
              {isDe ? "Google Ingenieurskunst & Siliziumarchitektur" : "Google Engineering & Silicon Architecture"}
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
              {isDe ? "Die 4 Schlüssel-Innovationen der Pixel 11 Serie" : "The 4 Core Innovations of the Pixel 11 Series"}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
              {isDe
                ? "Detaillierte Einblicke in Google Tensor G6, optische Periskop-Telezoomtechnik, reibungsloses Zahnradscharnier und Super Actua OLED."
                : "Deep architectural insights into Google Tensor G6, periscope telephoto optics, fluid gear hinge mechanics, and Super Actua OLED."}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {architectureCards.map((card) => {
              const { Icon } = card;
              const accent = card.accent;
              return (
                <article
                  key={card.key}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-background/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${accent.hover}`}
                >
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 size-36 rounded-full opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${accent.glow}`}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ${accent.icon}`}>
                      <Icon className="size-7" />
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${accent.tag}`}>
                      {card.tag}
                    </span>
                  </div>

                  <h3 className="relative mt-5 text-lg font-bold leading-snug tracking-tight text-foreground">
                    {card.title}
                  </h3>
                  <p className={`relative mt-1 text-sm font-semibold ${accent.text}`}>{card.highlight}</p>
                  <p className="relative mt-3 flex-1 text-sm leading-relaxed text-muted">{card.body}</p>

                  <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs">
                    <span className="text-muted">{card.statLabel}</span>
                    <span className="text-right font-semibold text-foreground">{card.statValue}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Specifications Matrix */}
      <section className="border-t border-border/80 bg-surface/30 py-16">
        <div className="container-page">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue">
              {isDe ? "Direkter Vergleich" : "Direct Comparison"}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {isDe ? "Technische Spezifikationen im Detail" : "Technical Specifications in Detail"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {isDe ? "Verifizierte Google Store & GSMArena Herstellerdaten" : "Verified Google Store and GSMArena manufacturer data"}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-strong/60">
                  <th className="p-4 font-semibold text-muted w-1/3">
                    {isDe ? "Kategorie" : "Specification"}
                  </th>
                  <th className={`p-4 font-bold w-1/3 ${selectedModel === "pixel11" ? "text-blue bg-blue/5" : "text-foreground"}`}>
                    Google Pixel 11 (6,3&quot;)
                  </th>
                  <th className={`p-4 font-bold w-1/3 ${selectedModel === "proFold" ? "text-blue bg-blue/5" : "text-foreground"}`}>
                    Pixel 11 Pro Fold (8,0&quot;)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {specRows.map((row) => (
                  <tr key={row.category} className="transition-colors hover:bg-surface/50">
                    <td className="p-4 font-medium text-muted">{row.category}</td>
                    <td className={`p-4 leading-relaxed ${selectedModel === "pixel11" ? "bg-blue/5 font-medium text-foreground" : "text-muted"}`}>
                      {row.pixel11}
                    </td>
                    <td className={`p-4 leading-relaxed ${selectedModel === "proFold" ? "bg-blue/5 font-medium text-foreground" : "text-muted"}`}>
                      {row.proFold}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Hamburg Boutique Confidence & Trade-In */}
      <section className="border-t border-border/70 bg-surface/40 py-14">
        <div className="container-page">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-blue">
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
              <div className="text-xs font-bold uppercase tracking-wider text-blue">
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
              <div className="text-xs font-bold uppercase tracking-wider text-blue">
                {isDe ? "Inzahlungnahme" : "Trade-In"}
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isDe ? "Altgerät sofort anrechnen" : "Instant Trade-In Credit"}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {isDe
                  ? "Geben Sie Ihr bisheriges iPhone, Galaxy oder Pixel Gerät in Zahlung und sichern Sie sich direkten Preisnachlass."
                  : "Trade in your current iPhone, Galaxy or Pixel phone for an immediate valuation credit toward your new device."}
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
                    className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-foreground hover:text-blue transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{isDe ? faq.qDe : faq.qEn}</span>
                    <ChevronDownIcon
                      className={`size-4 text-muted transition-transform duration-200 ${isOpen ? "rotate-180 text-blue" : ""}`}
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

    </div>
  );
}
