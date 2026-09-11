"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Locale } from "@/lib/i18n";
import { siteInfo } from "@/lib/site";
import { SAMSUNG_FINISHES, type SamsungFinish } from "@/lib/samsung-fold3d";
import s from "./GalaxyFoldShowcase.module.css";

const Fold3DViewer = dynamic(() => import("./Fold3DViewer"), {
  ssr: false,
  loading: () => <div className="aspect-square w-full animate-pulse rounded-2xl bg-surface-strong/40 sm:aspect-[4/3]" />,
});

export type SamsungModelId = "fold8" | "ultra";

export type GalaxyFoldShowcaseProps = {
  locale: Locale;
  initialModel?: SamsungModelId;
};

type Finish = SamsungFinish;

type ViewMode = "unfolded" | "colors" | "profile" | "lineup" | "video";

const FOLD8_FINISHES: Finish[] = SAMSUNG_FINISHES.fold8;
const ULTRA_FINISHES: Finish[] = SAMSUNG_FINISHES.ultra;

/* -------------------------------------------------------------------------- */
/* Clean Vector Icons & Architecture SVGs (Zero Emojis)                      */
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

function ChevronDownIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Precision Hardware Architecture SVGs                                       */
/* -------------------------------------------------------------------------- */

// 1. Snapdragon 8 Elite Gen 5 (3nm Silicon Die Architecture)
function SnapdragonCpuSvg({ className = "size-8" }: { className?: string }) {
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

function IsocellCameraSvg({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="1.6" opacity="0.7" />
      <circle cx="24" cy="24" r="3.5" fill="currentColor" />
      <path d="M24 8v3M24 37v3M8 24h3M37 24h3M12.7 12.7l2 2M33.3 33.3l2 2M35.3 12.7l-2 2M14.7 33.3l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function FlexHingeSvg({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="6" y="9" width="17" height="30" rx="4" stroke="currentColor" strokeWidth="2" />
      <rect x="25" y="9" width="17" height="30" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="1.7" fill="currentColor" />
    </svg>
  );
}

function AmoledDisplaySvg({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="9" y="8" width="30" height="32" rx="6" stroke="currentColor" strokeWidth="2" />
      <path d="M14 26 Q18 15 22 26 T30 26 T38 26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="34" r="1.8" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Main GalaxyFoldShowcase Component                                          */
/* -------------------------------------------------------------------------- */

const ARCH_ACCENTS = {
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

export default function GalaxyFoldShowcase({
  locale,
  initialModel = "fold8",
}: GalaxyFoldShowcaseProps) {
  const isDe = locale === "de";
  const [, startTransition] = useTransition();

  const [selectedModel, setSelectedModel] = useState<SamsungModelId>(initialModel);
  const [viewMode, setViewMode] = useState<ViewMode>(initialModel === "ultra" ? "unfolded" : "unfolded");
  const [selectedFinishIndex, setSelectedFinishIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Switch finishes based on active model
  const activeFinishes = selectedModel === "fold8" ? FOLD8_FINISHES : ULTRA_FINISHES;
  const currentFinish = activeFinishes[selectedFinishIndex] || activeFinishes[0];

  const handleSelectModel = (model: SamsungModelId) => {
    startTransition(() => {
      setSelectedModel(model);
      setSelectedFinishIndex(0);
      setViewMode("unfolded");
    });
  };

  // Determine current active visual asset based on model and view mode
  const getActiveAsset = () => {
    if (viewMode === "video") {
      return {
        type: "video" as const,
        src:
          selectedModel === "ultra"
            ? "/images/samsung/zfold8/galaxy-z-fold8-ultra-design.mp4"
            : "/images/samsung/zfold8/galaxy-z-fold8-design.mp4",
        labelDe: selectedModel === "ultra" ? "Design-Video (Z Fold8 Ultra)" : "Design-Video (Z Fold8)",
        labelEn: selectedModel === "ultra" ? "Design Video (Z Fold8 Ultra)" : "Design Video (Z Fold8)",
      };
    }
    if (viewMode === "lineup") {
      return {
        type: "3d" as const,
        labelDe: "Lineup: Fold8 (4,5 mm) vs. Fold8 Ultra (8,0 Zoll)",
        labelEn: "Lineup: Fold8 (4.5mm) vs. Fold8 Ultra (8.0-inch)",
      };
    }
    if (viewMode === "profile") {
      return {
        type: "3d" as const,
        labelDe: "Gefaltetes Ultra-Slim Profil (Zero-Gap Scharnier)",
        labelEn: "Folded Ultra-Slim Profile (Zero-Gap Hinge)",
      };
    }
    if (viewMode === "unfolded") {
      if (selectedModel === "ultra") {
        return {
          type: "3d" as const,
          labelDe: "Galaxy Z Fold8 Ultra – 8,0\" Dynamic LTPO AMOLED 2X entfaltet",
          labelEn: "Galaxy Z Fold8 Ultra – 8.0\" Dynamic LTPO AMOLED 2X Unfolded",
        };
      }
      return {
        type: "3d" as const,
        labelDe: "Galaxy Z Fold8 – 7,6\" Dynamic LTPO AMOLED 2X entfaltet",
        labelEn: "Galaxy Z Fold8 – 7.6\" Dynamic LTPO AMOLED 2X Unfolded",
      };
    }
    // "colors" mode
    return {
      type: "3d" as const,
      labelDe: currentFinish.nameDe,
      labelEn: currentFinish.nameEn,
    };
  };

  const activeAsset = getActiveAsset();

  // Prefilled WhatsApp consultation
  const waText = encodeURIComponent(
    isDe
      ? `Guten Tag Apfel Park Team, ich interessiere mich für das Samsung ${
          selectedModel === "fold8"
            ? "Galaxy Z Fold8 (4,5 mm Ultra-Slim)"
            : "Galaxy Z Fold8 Ultra (8 Zoll 200MP Titanium)"
        } in der Farbe ${isDe ? currentFinish.nameDe : currentFinish.nameEn}. Bitte senden Sie mir ein unverbindliches Angebot sowie Infos zu Verfügbarkeit und Abholung in Hamburg.`
      : `Hello Apfel Park Team, I am inquiring about the Samsung ${
          selectedModel === "fold8"
            ? "Galaxy Z Fold8 (4.5mm Ultra-Slim)"
            : "Galaxy Z Fold8 Ultra (8-Inch 200MP Titanium)"
        } in ${currentFinish.nameEn}. Please provide pricing, stock availability, and collection details in Hamburg.`
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
      ultra: isDe ? "5,4 mm entfaltet · 11,8 mm gefaltet · 235g Gewicht (Grade 5 Titan)" : "5.4 mm unfolded · 11.8 mm folded · 235g weight (Grade 5 Titanium)",
    },
    {
      category: isDe ? "Hauptdisplay (Innen)" : "Main Canvas (Inner)",
      fold8: isDe ? "7,6\" Dynamic LTPO AMOLED 2X · 1-120 Hz · 3.000 Nits Spitzenhelligkeit · 1828 x 2448" : "7.6\" Dynamic LTPO AMOLED 2X · 1-120 Hz · 3,000 nits peak · 1828 x 2448",
      ultra: isDe ? "8,0\" Dynamic LTPO AMOLED 2X · 1-120 Hz · 3.200 Nits · Wacom S-Pen Digitizer · 2184 x 1968" : "8.0\" Dynamic LTPO AMOLED 2X · 1-120 Hz · 3,200 nits · Wacom S-Pen Digitizer · 2184 x 1968",
    },
    {
      category: isDe ? "Cover-Display (Außen)" : "Cover Screen (Outer)",
      fold8: isDe ? "5,5\" Dynamic LTPO AMOLED 2X · 120 Hz · 2.600 Nits" : "5.5\" Dynamic LTPO AMOLED 2X · 120 Hz · 2,600 nits",
      ultra: isDe ? "6,5\" Dynamic LTPO AMOLED 2X · 120 Hz · 3.000 Nits (Gorilla Glass Armor 2)" : "6.5\" Dynamic LTPO AMOLED 2X · 120 Hz · 3,000 nits (Gorilla Glass Armor 2)",
    },
    {
      category: isDe ? "Prozessor & Silicon" : "Processor & Silicon",
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
      category: isDe ? "Gehäuse & Schutzklasse" : "Chassis & Durability",
      fold8: isDe ? "Verstärktes Armor Aluminum · Flex Teardrop Zero-Gap Scharnier · IP48" : "Reinforced Armor Aluminum · Flex Teardrop Zero-Gap Hinge · IP48",
      ultra: isDe ? "Grade 5 Titanrahmen · Reflexionsarmes Armor 2 Glas · Zero-Gap Scharnier · IP48" : "Grade 5 Titanium frame · Anti-reflective Armor 2 glass · Zero-Gap Hinge · IP48",
    },
  ];

  // FAQ entries
  const faqs = [
    {
      qDe: "Wann ist das Samsung Galaxy Z Fold8 in Deutschland erhältlich?",
      qEn: "When is the Samsung Galaxy Z Fold8 available in Germany?",
      aDe: "Das Samsung Galaxy Z Fold8 sowie das Z Fold8 Ultra wurden offiziell vorgestellt und sind bei Apfel Park Hamburg ab sofort lieferbar. Alle Geräte sind vertragsfrei und für alle Mobilfunknetze freigeschaltet.",
      aEn: "The Samsung Galaxy Z Fold8 and Z Fold8 Ultra have launched and are available at Apfel Park Hamburg. All units are factory unlocked for all carriers.",
    },
    {
      qDe: "Wie unterscheidet sich das Galaxy Z Fold8 vom Z Fold8 Ultra?",
      qEn: "How does the Galaxy Z Fold8 differ from the Z Fold8 Ultra?",
      aDe: "Das Galaxy Z Fold8 setzt mit nur 4,5 mm Dicke und 201g auf maximale Leichtigkeit und Handlichkeit. Das Z Fold8 Ultra bietet ein größeres 8-Zoll-Display, einen 200 MP ISOCELL Kamerasensor mit 5x Periskop-Telezoom, S-Pen Digitizer-Unterstützung und ein Gehäuse aus Grade 5 Titan.",
      aEn: "The Galaxy Z Fold8 focuses on extreme thinness (4.5mm) and portability at just 201g. The Z Fold8 Ultra provides an expansive 8-inch canvas, a 200MP ISOCELL camera with 5x periscope telephoto zoom, S-Pen digitizer support, and Grade 5 titanium construction.",
    },
    {
      qDe: "Hat das Galaxy Z Fold8 einen störenden Falz im Innendisplay?",
      qEn: "Does the Galaxy Z Fold8 have a noticeable screen crease?",
      aDe: "Samsung verwendet bei beiden Modellen die neueste Generation des Flex Teardrop Zero-Gap Scharniers. Der Displayfalz wurde im Vergleich zu früheren Generationen drastisch minimiert und schließt völlig bündig ab.",
      aEn: "Samsung equips both models with its latest Flex Teardrop Zero-Gap hinge. The inner display crease has been substantially minimized and closes completely flush.",
    },
    {
      qDe: "Sind die Geräte ohne Vertrag und für alle SIM-Karten geeignet?",
      qEn: "Are the devices unlocked without contract for all carriers?",
      aDe: "Ja, alle bei Apfel Park verkauften Smartphones sind zu 100% vertragsfrei (ohne SIM-Lock) und unterstützen Dual-SIM sowie eSIM für alle deutschen und internationalen Mobilfunkanbieter.",
      aEn: "Yes, all smartphones sold at Apfel Park are 100% factory unlocked without SIM-lock, supporting Dual-SIM and eSIM across all German and global carriers.",
    },
  ];

  const architectureCards = [
    {
      key: "snapdragon",
      accent: ARCH_ACCENTS.gold,
      Icon: SnapdragonCpuSvg,
      tag: "3nm TSMC N3E",
      title: "Snapdragon 8 Elite Gen 5",
      highlight: "4,32 GHz Oryon CPU · 45 TOPS NPU",
      body: isDe
        ? "Maßgeschneiderter 3nm-Halbleiter mit dediziertem Hexagon Tensor-Prozessor. Ermöglicht Live-Dolmetschen, Galaxy AI Echtzeit-Transkription und bis zu 40% mehr Grafikleistung."
        : "Custom 3nm silicon fabricated with dual 4.32GHz Oryon Prime cores and a dedicated Hexagon NPU. Powers on-device Galaxy AI translation and desktop-grade gaming.",
      statLabel: isDe ? "Architektur" : "Architecture",
      statValue: "Oryon + Adreno 830",
    },
    {
      key: "camera",
      accent: ARCH_ACCENTS.gold,
      Icon: IsocellCameraSvg,
      tag: "200 MP · 1/1.3\"",
      title: isDe ? "200 MP ISOCELL ProVisual" : "200MP ISOCELL ProVisual",
      highlight: "Tetra2pixel · 5x Periskop Zoom",
      body: isDe
        ? "Erstmals in einem Foldable: Der 200 MP Hauptsensor mit f/1.7 Blende fängt bis zu 60% mehr Licht ein. Gekoppelt mit 5x optischem Periskop-Telezoom für Aufnahmen bis 100x Space Zoom."
        : "First time in a foldable: a 200MP sensor with f/1.7 aperture and Tetra2pixel binning captures 60% more light. Paired with a 5x optical periscope lens for up to 100x Space Zoom.",
      statLabel: isDe ? "Optische Stabilisierung" : "Optical Stabilization",
      statValue: isDe ? "4-Achsen OIS Gyro" : "4-axis OIS gyro",
    },
    {
      key: "hinge",
      accent: ARCH_ACCENTS.green,
      Icon: FlexHingeSvg,
      tag: isDe ? "0,0 mm Falz" : "0.0 mm crease",
      title: isDe ? "Flex Zero-Gap Scharnier" : "Flex Zero-Gap Hinge",
      highlight: isDe ? "Grade 5 Titan · IP48 Wasserfest" : "Grade 5 titanium · IP48 water resistant",
      body: isDe
        ? "Doppelspuren-Planetengetriebe mit patentiertem Wassertropfen-Radius. Schließt absolut bündig ohne Zwischenraum und minimiert die Displayfalte auf ein kaum wahrnehmbares Niveau."
        : "Dual-rail planetary gear assembly with waterdrop teardrop geometry. Closes perfectly flush with zero gap, reducing the inner screen crease to an imperceptible level.",
      statLabel: isDe ? "Dauerhaltbarkeit" : "Durability Test",
      statValue: isDe ? "300.000 Faltungen" : "300,000 folds",
    },
    {
      key: "display",
      accent: ARCH_ACCENTS.gold,
      Icon: AmoledDisplaySvg,
      tag: "3.200 Nits · LTPO",
      title: "Dynamic LTPO AMOLED 2X",
      highlight: "1-120 Hz variabel · Wacom EMR",
      body: isDe
        ? "Brillantes Display mit Ultra-Thin-Glass (UTG) und flexibler Bildwiederholrate von 1 Hz bis 120 Hz. Beim Fold8 Ultra mit integriertem Wacom-Digitizer für reflexionsfreie S-Pen Handschrift."
        : "Stunning canvas featuring Ultra-Thin Glass (UTG) and variable refresh rates from 1Hz to 120Hz. Fold8 Ultra includes an integrated Wacom digitizer for natural S-Pen handwriting.",
      statLabel: isDe ? "Farbraumabdeckung" : "Color Space",
      statValue: "100% DCI-P3",
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
              Samsung
            </Link>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">
              {selectedModel === "fold8" ? "Galaxy Z Fold8" : "Galaxy Z Fold8 Ultra"}
            </span>
          </nav>

          <div className="flex items-center gap-2 text-muted">
            <span className="size-1.5 rounded-full bg-gold" />
            <span>{isDe ? "Hamburg Boutique & bundesweiter Expressversand" : "Hamburg Boutique & Nationwide Express Shipping"}</span>
          </div>
        </div>
      </div>

      {/* Hero Header (Strictly clean editorial layout — zero embedded banners) */}
      <header className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-surface/80 via-background to-background pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="container-page relative z-10 text-center">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-gold uppercase">
              <span>{isDe ? "Samsung Flaggschiff Innovation 2026" : "Samsung Flagship Innovation 2026"}</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl font-sans text-balance">
              {selectedModel === "fold8" ? (
                <>
                  Galaxy Z Fold8
                  <span className="block text-xl sm:text-3xl lg:text-4xl font-medium text-muted mt-2">
                    {isDe ? "Die neue Ära des Faltens. Rekord-dünn mit 4,5 mm." : "The New Era of Folding. Record 4.5mm Ultra-Slim."}
                  </span>
                </>
              ) : (
                <>
                  Galaxy Z Fold8 Ultra
                  <span className="block text-xl sm:text-3xl lg:text-4xl font-medium text-muted mt-2">
                    {isDe ? "Das 8,0-Zoll Flaggschiff mit 200 MP Optik & Titan." : "The 8.0-Inch Powerhouse with 200MP Optics & Titanium."}
                  </span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-muted leading-relaxed text-balance">
              {selectedModel === "fold8"
                ? (isDe
                  ? "Samsungs dünnstes und leichtestes Foldable aller Zeiten. 7,6-Zoll Dynamic LTPO AMOLED 2X, 5,5-Zoll Cover, Snapdragon 8 Elite Gen 5 und robustes Armor Aluminum bei nur 201g."
                  : "Samsung's thinnest and lightest foldable to date. 7.6-inch Dynamic LTPO AMOLED 2X, 5.5-inch cover screen, Snapdragon 8 Elite Gen 5 silicon and Armor Aluminum build at just 201g.")
                : (isDe
                  ? "Kompromisslose Produktivität. 8,0-Zoll Riesen-Canvas mit S-Pen Digitizer, 200 MP ISOCELL Hauptkamera mit 5x Periskop-Telezoom, Grade 5 Titanrahmen und 5.000 mAh Akku."
                  : "Uncompromising powerhouse. Expansive 8.0-inch canvas with S-Pen digitizer, 200MP ISOCELL main camera with 5x periscope telephoto, Grade 5 titanium chassis and 5,000 mAh battery.")}
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
              onClick={() => handleSelectModel("fold8")}
              className={`min-h-[44px] rounded-xl px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all sm:min-h-[38px] sm:whitespace-nowrap sm:rounded-full sm:px-6 sm:py-1.5 sm:text-sm ${
                selectedModel === "fold8"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              aria-pressed={selectedModel === "fold8"}
            >
              Galaxy Z Fold8 (4,5 mm)
            </button>
            <button
              type="button"
              onClick={() => handleSelectModel("ultra")}
              className={`min-h-[44px] rounded-xl px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-all sm:min-h-[38px] sm:whitespace-nowrap sm:rounded-full sm:px-6 sm:py-1.5 sm:text-sm ${
                selectedModel === "ultra"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              aria-pressed={selectedModel === "ultra"}
            >
              {isDe ? "Galaxy Z Fold8 Ultra (8 Zoll 200MP)" : "Galaxy Z Fold8 Ultra (8-Inch 200MP)"}
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Media & Design Showcase Gallery */}
      <section className="py-10 md:py-16">
        <div className="container-page">
          {/* Header Controls & View Selector */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl text-foreground">
                  {selectedModel === "fold8" ? "Galaxy Z Fold8" : "Galaxy Z Fold8 Ultra"}
                </h2>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold">
                  {selectedModel === "fold8" ? "4,5 mm Slim" : "Titanium 200MP"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                {isDe
                  ? "Interaktive Galerie mit hochauflösenden Ansichten und fließenden Farbwechseln"
                  : "Interactive high-resolution showcase with fluid color transitions"}
              </p>
            </div>

            {/* View Selector Pills (Responsive horizontal scroll) */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1 text-xs">
              {/* 1. Unfolded Canvas */}
              <button
                type="button"
                onClick={() => setViewMode("unfolded")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "unfolded" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {selectedModel === "ultra" ? (isDe ? "8,0\" Display entfaltet" : "8.0\" Canvas Unfolded") : (isDe ? "7,6\" Display entfaltet" : "7.6\" Canvas Unfolded")}
              </button>

              {/* 2. Color Variants / Finishes */}
              <button
                type="button"
                onClick={() => setViewMode("colors")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "colors" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                <span>{isDe ? "Farben & Finishes" : "Colors & Finishes"}</span>
              </button>

              {/* 3. Slim Folded Profile */}
              <button
                type="button"
                onClick={() => setViewMode("profile")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "profile" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {isDe ? "Gefaltetes Profil" : "Folded Profile"}
              </button>

              {/* 4. Dual Lineup */}
              <button
                type="button"
                onClick={() => setViewMode("lineup")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "lineup" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                Lineup
              </button>

              {/* 5. Official Samsung Design Video */}
              <button
                type="button"
                onClick={() => setViewMode("video")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "video" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                <PlayIcon className="size-3.5" />
                <span>{isDe ? "Design-Video" : "Design Video"}</span>
              </button>
            </div>
          </div>

          {/* Main Visual Stage (Expanded Sizing with Ambient Lighting & Smooth Keyframes) */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-strong/50 p-4 sm:p-8 flex flex-col items-center justify-center min-h-[460px] sm:min-h-[580px] md:min-h-[660px] lg:min-h-[720px]">
            {/* Dynamic Ambient Glow Sphere matching current finish */}
            <div
              className={s.ambientBackdrop}
              style={{
                backgroundColor:
                  viewMode === "colors"
                    ? currentFinish.colorHex
                    : selectedModel === "ultra"
                    ? "#9b8ec4"
                    : "#d49e42",
              }}
              aria-hidden="true"
            />

            {/* Stage Content */}
            {activeAsset.type === "video" ? (
              <div className="relative z-10 w-full max-w-4xl aspect-[16/9] overflow-hidden rounded-2xl bg-black border border-border shadow-2xl">
                <video
                  ref={videoRef}
                  src={activeAsset.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative z-10 w-full flex flex-col items-center justify-center space-y-6">
                {/* Genuine official Samsung 3D model: 360 drag, live finishes and fold pose. */}
                <div className="relative w-full max-w-3xl drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)]">
                  <Fold3DViewer
                    key={viewMode === "lineup" ? "lineup" : selectedModel}
                    model={viewMode === "lineup" ? "lineup" : selectedModel}
                    finish={currentFinish.id}
                    folded={viewMode === "profile"}
                  />
                </div>

                {/* Subtitle / Asset Title & Interactive Color Swatches */}
                <div className="text-center space-y-3 z-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-4 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-sm">
                    <span>{isDe ? activeAsset.labelDe : activeAsset.labelEn}</span>
                  </div>

                  {viewMode === "colors" && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-center gap-3 sm:gap-4" role="group" aria-label="Color Selection">
                        {activeFinishes.map((finish, idx) => {
                          const isActive = idx === selectedFinishIndex;
                          return (
                            <button
                              key={finish.id}
                              type="button"
                              onClick={() => setSelectedFinishIndex(idx)}
                              className={`size-10 sm:size-11 rounded-full transition-all duration-300 relative flex items-center justify-center min-h-[44px] min-w-[44px] ${
                                isActive
                                  ? "scale-110 ring-2 ring-gold ring-offset-2 ring-offset-background shadow-lg shadow-gold/25"
                                  : "opacity-80 hover:opacity-100 hover:scale-105"
                              }`}
                              style={{ backgroundColor: finish.colorHex }}
                              title={isDe ? finish.nameDe : finish.nameEn}
                              aria-label={isDe ? finish.nameDe : finish.nameEn}
                              aria-pressed={isActive}
                            >
                              {isActive && (
                                <span className="size-2 rounded-full bg-white/90 shadow-sm" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-center text-[11px] text-muted">
                        {isDe ? currentFinish.nameDe : currentFinish.nameEn} · {isDe ? currentFinish.badgeDe : currentFinish.badgeEn}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Silicon & Engineering Hardware Architecture */}
      <section className="relative overflow-hidden border-t border-border/80 bg-surface/20 py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
              {isDe ? "Ingenieurskunst & Prozessorarchitektur" : "Engineering & Silicon Architecture"}
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
              {isDe ? "Die 4 Schlüssel-Innovationen der Z Fold8 Serie" : "The 4 Core Innovations of the Z Fold8 Series"}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
              {isDe
                ? "Detaillierte Einblicke in Prozessor-Halbleiter, optische Sensortechnik, Scharnier-Mechanik und LTPO-Displaymatrix."
                : "Deep architectural breakdown of 3nm silicon, periscope optical sensor suite, zero-gap hinge dynamics, and LTPO display physics."}
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

    </div>
  );
}
