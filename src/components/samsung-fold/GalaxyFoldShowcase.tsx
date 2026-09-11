"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { siteInfo } from "@/lib/site";
import s from "./GalaxyFoldShowcase.module.css";

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
  badgeDe: string;
  badgeEn: string;
};

type ViewMode = "unfolded" | "colors" | "profile" | "lineup" | "video";

const FOLD8_FINISHES: Finish[] = [
  {
    id: "pistachio",
    nameDe: "Pistachio",
    nameEn: "Pistachio",
    colorHex: "#8fb96a",
    src: "/images/samsung/zfold8/phone-pistachio.webp",
    badgeDe: "Exklusiv-Farbe 2026",
    badgeEn: "Exclusive Edition 2026",
  },
  {
    id: "lavender",
    nameDe: "Lavender",
    nameEn: "Lavender",
    colorHex: "#b8a9d4",
    src: "/images/samsung/zfold8/phone-lavender.webp",
    badgeDe: "Sanfte Eleganz",
    badgeEn: "Soft Elegance",
  },
  {
    id: "cream",
    nameDe: "Cream",
    nameEn: "Cream",
    colorHex: "#e8e2d8",
    src: "/images/samsung/zfold8/phone-cream.webp",
    badgeDe: "Klassisches Warmweiß",
    badgeEn: "Classic Warm White",
  },
  {
    id: "graphite",
    nameDe: "Graphite",
    nameEn: "Graphite",
    colorHex: "#3a3a3c",
    src: "/images/samsung/zfold8/phone-graphite.webp",
    badgeDe: "Mattes Tiefschwarz",
    badgeEn: "Matte Deep Black",
  },
];

const ULTRA_FINISHES: Finish[] = [
  {
    id: "violet",
    nameDe: "Violet Shadow Titanium",
    nameEn: "Violet Shadow Titanium",
    colorHex: "#9b8ec4",
    src: "/images/samsung/zfold8/ultra-violet.webp",
    badgeDe: "Flaggschiff-Finish",
    badgeEn: "Flagship Finish",
  },
  {
    id: "graphite",
    nameDe: "Graphite Titanium",
    nameEn: "Graphite Titanium",
    colorHex: "#3a3a3c",
    src: "/images/samsung/zfold8/ultra-graphite.webp",
    badgeDe: "Grade 5 Titan",
    badgeEn: "Grade 5 Titanium",
  },
  {
    id: "cream",
    nameDe: "Cream Titanium",
    nameEn: "Cream Titanium",
    colorHex: "#e8e2d8",
    src: "/images/samsung/zfold8/ultra-cream.webp",
    badgeDe: "Reflexionsarm",
    badgeEn: "Anti-Reflective",
  },
  {
    id: "green",
    nameDe: "Green Shadow Titanium",
    nameEn: "Green Shadow Titanium",
    colorHex: "#6b9e6b",
    src: "/images/samsung/zfold8/ultra-green.webp",
    badgeDe: "Boutique Edition",
    badgeEn: "Boutique Edition",
  },
];

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

function ExpandIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function MinimizeIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
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

function ZoomInIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Precision Hardware Architecture SVGs                                       */
/* -------------------------------------------------------------------------- */

// 1. Snapdragon 8 Elite Gen 5 (3nm Silicon Die Architecture)
function SnapdragonCpuSvg({ className = "size-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cpuGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5e6a3" />
          <stop offset="50%" stopColor="#d49e42" />
          <stop offset="100%" stopColor="#b5842f" />
        </linearGradient>
        <linearGradient id="dieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#252427" />
          <stop offset="100%" stopColor="#121214" />
        </linearGradient>
      </defs>
      {/* Outer Ceramic Substrate */}
      <rect x="8" y="8" width="104" height="104" rx="8" fill="#18181b" stroke="url(#cpuGoldGrad)" strokeWidth="1.5" />
      {/* Corner alignment notch */}
      <polygon points="8,8 22,8 8,22" fill="#d49e42" opacity="0.8" />
      {/* Perimeter BGA trace pins */}
      <g stroke="#d49e42" strokeWidth="1.2" opacity="0.6">
        <line x1="28" y1="4" x2="28" y2="8" /><line x1="40" y1="4" x2="40" y2="8" />
        <line x1="52" y1="4" x2="52" y2="8" /><line x1="68" y1="4" x2="68" y2="8" />
        <line x1="80" y1="4" x2="80" y2="8" /><line x1="92" y1="4" x2="92" y2="8" />
        <line x1="28" y1="112" x2="28" y2="116" /><line x1="40" y1="112" x2="40" y2="116" />
        <line x1="52" y1="112" x2="52" y2="116" /><line x1="68" y1="112" x2="68" y2="116" />
        <line x1="80" y1="112" x2="80" y2="116" /><line x1="92" y1="112" x2="92" y2="116" />
        <line x1="4" y1="28" x2="8" y2="28" /><line x1="4" y1="40" x2="8" y2="40" />
        <line x1="4" y1="52" x2="8" y2="52" /><line x1="4" y1="68" x2="8" y2="68" />
        <line x1="4" y1="80" x2="8" y2="80" /><line x1="4" y1="92" x2="8" y2="92" />
        <line x1="112" y1="28" x2="116" y2="28" /><line x1="112" y1="40" x2="116" y2="40" />
        <line x1="112" y1="52" x2="116" y2="52" /><line x1="112" y1="68" x2="116" y2="68" />
        <line x1="112" y1="80" x2="116" y2="80" /><line x1="112" y1="92" x2="116" y2="92" />
      </g>
      {/* Central 3nm Silicon Die */}
      <rect x="24" y="24" width="72" height="72" rx="4" fill="url(#dieGrad)" stroke="rgba(212, 158, 66, 0.4)" strokeWidth="1" />
      {/* Oryon Prime Cores (Top) */}
      <rect x="30" y="30" width="28" height="18" rx="2" fill="rgba(212, 158, 66, 0.18)" stroke="#d49e42" strokeWidth="0.8" />
      <text x="44" y="42" fill="#f5e6a3" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">2x 4.32GHz</text>
      {/* Oryon Performance Cores */}
      <rect x="62" y="30" width="28" height="18" rx="2" fill="rgba(212, 158, 66, 0.12)" stroke="#d49e42" strokeWidth="0.8" />
      <text x="76" y="42" fill="#d49e42" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">6x Oryon</text>
      {/* Adreno Next-Gen GPU */}
      <rect x="30" y="52" width="36" height="22" rx="2" fill="rgba(79, 163, 106, 0.16)" stroke="#4fa36a" strokeWidth="0.8" />
      <text x="48" y="66" fill="#52a86e" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Adreno GPU</text>
      {/* Hexagon NPU 45 TOPS */}
      <rect x="70" y="52" width="20" height="22" rx="2" fill="rgba(90, 127, 183, 0.2)" stroke="#7fa2d6" strokeWidth="0.8" />
      <text x="80" y="63" fill="#7fa2d6" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">45 TOPS</text>
      <text x="80" y="70" fill="#7fa2d6" fontSize="5" textAnchor="middle" fontFamily="sans-serif">NPU</text>
      {/* 3nm Process Node & LPDDR5X Bus */}
      <rect x="30" y="78" width="60" height="12" rx="2" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.8" />
      <text x="60" y="87" fill="#ffffff" fontSize="6" fontWeight="600" letterSpacing="1" textAnchor="middle" fontFamily="sans-serif">3nm TSMC N3E · LPDDR5X</text>
    </svg>
  );
}

// 2. 200 MP ISOCELL ProVisual Sensor Architecture
function IsocellCameraSvg({ className = "size-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lensRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9b8ec4" />
          <stop offset="50%" stopColor="#d49e42" />
          <stop offset="100%" stopColor="#3a3a3c" />
        </linearGradient>
        <radialGradient id="sensorGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(212, 158, 66, 0.35)" />
          <stop offset="80%" stopColor="rgba(155, 142, 196, 0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* Chassis Housing */}
      <rect x="10" y="10" width="100" height="100" rx="16" fill="#151518" stroke="url(#lensRingGrad)" strokeWidth="1.5" />
      {/* OIS Gyroscope magnetic suspension axes */}
      <circle cx="60" cy="60" r="44" stroke="rgba(212, 158, 66, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M60 12 L60 20 M60 100 L60 108 M12 60 L20 60 M100 60 L108 60" stroke="#d49e42" strokeWidth="1.5" strokeLinecap="round" />
      {/* Outer Lens Bezel */}
      <circle cx="60" cy="60" r="36" fill="#1b1b1e" stroke="#d49e42" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="30" fill="url(#sensorGlow)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
      {/* 200MP Subpixel Grid */}
      <g stroke="rgba(212, 158, 66, 0.4)" strokeWidth="0.7">
        <line x1="42" y1="46" x2="78" y2="46" /><line x1="42" y1="53" x2="78" y2="53" />
        <line x1="42" y1="60" x2="78" y2="60" /><line x1="42" y1="67" x2="78" y2="67" />
        <line x1="42" y1="74" x2="78" y2="74" />
        <line x1="46" y1="42" x2="46" y2="78" /><line x1="53" y1="42" x2="53" y2="78" />
        <line x1="60" y1="42" x2="60" y2="78" /><line x1="67" y1="42" x2="67" y2="78" />
        <line x1="74" y1="42" x2="74" y2="78" />
      </g>
      {/* Aperture Iris Center */}
      <circle cx="60" cy="60" r="10" fill="#0b0b0c" stroke="#f5e6a3" strokeWidth="1.2" />
      <text x="60" y="63" fill="#f5e6a3" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">f/1.7</text>
      {/* Optical Spec Callouts */}
      <text x="60" y="103" fill="#d49e42" fontSize="5.5" fontWeight="bold" letterSpacing="0.8" textAnchor="middle" fontFamily="sans-serif">200MP · 1/1.3&quot; · 5X PERISCOPE</text>
    </svg>
  );
}

// 3. Flex Teardrop Zero-Gap Precision Hinge Blueprint
function FlexHingeSvg({ className = "size-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="hingeGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5e6a3" />
          <stop offset="100%" stopColor="#d49e42" />
        </linearGradient>
      </defs>
      {/* Mechanical Blueprint Ground */}
      <rect x="10" y="10" width="100" height="100" rx="12" fill="#141416" stroke="rgba(212, 158, 66, 0.4)" strokeWidth="1.2" />
      {/* Blueprint Grid Lines */}
      <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8">
        <line x1="10" y1="35" x2="110" y2="35" /><line x1="10" y1="60" x2="110" y2="60" /><line x1="10" y1="85" x2="110" y2="85" />
        <line x1="35" y1="10" x2="35" y2="110" /><line x1="60" y1="10" x2="60" y2="110" /><line x1="85" y1="10" x2="85" y2="110" />
      </g>
      {/* Left Wing Folding Plate */}
      <path d="M22 45 L52 45 L52 75 L22 75 Z" fill="#222125" stroke="#a1a1aa" strokeWidth="1.2" />
      {/* Right Wing Folding Plate */}
      <path d="M68 45 L98 45 L98 75 L68 75 Z" fill="#222125" stroke="#a1a1aa" strokeWidth="1.2" />
      {/* Teardrop Waterdrop Curve Guide (Zero-Gap) */}
      <path d="M52 50 C56 50 60 46 60 40 C60 46 64 50 68 50 C68 66 52 66 52 50 Z" fill="rgba(212, 158, 66, 0.15)" stroke="url(#hingeGold)" strokeWidth="1.5" />
      {/* Dual Synchronized Planetary Gears */}
      <circle cx="56" cy="62" r="6" fill="#1b1b1e" stroke="#d49e42" strokeWidth="1.2" />
      <circle cx="56" cy="62" r="2" fill="#d49e42" />
      <circle cx="64" cy="62" r="6" fill="#1b1b1e" stroke="#d49e42" strokeWidth="1.2" />
      <circle cx="64" cy="62" r="2" fill="#d49e42" />
      {/* Zero Gap indicator */}
      <line x1="60" y1="26" x2="60" y2="36" stroke="#4fa36a" strokeWidth="1.5" />
      <text x="60" y="24" fill="#4fa36a" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">0.0 mm GAP</text>
      {/* Armor Specs */}
      <text x="60" y="98" fill="#d49e42" fontSize="5.5" fontWeight="bold" letterSpacing="0.8" textAnchor="middle" fontFamily="sans-serif">GRADE 5 TITANIUM · IP48</text>
    </svg>
  );
}

// 4. Dynamic LTPO AMOLED 2X 1-120Hz & Wacom Digitizer Display Matrix
function AmoledDisplaySvg({ className = "size-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="oledGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4fa36a" />
          <stop offset="50%" stopColor="#d49e42" />
          <stop offset="100%" stopColor="#5a7fb7" />
        </linearGradient>
      </defs>
      {/* Display Frame */}
      <rect x="12" y="12" width="96" height="96" rx="10" fill="#121214" stroke="url(#oledGlow)" strokeWidth="1.5" />
      {/* 1Hz to 120Hz dynamic waveform */}
      <path
        d="M20 54 Q28 32 36 54 T52 54 T68 54 T84 54 T100 54"
        fill="none"
        stroke="#d49e42"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* S-Pen Digitizer Resonance Loops */}
      <g stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8">
        <rect x="22" y="68" width="76" height="24" rx="3" fill="rgba(255, 255, 255, 0.02)" />
        <line x1="32" y1="68" x2="32" y2="92" /><line x1="44" y1="68" x2="44" y2="92" />
        <line x1="56" y1="68" x2="56" y2="92" /><line x1="68" y1="68" x2="68" y2="92" />
        <line x1="80" y1="68" x2="80" y2="92" />
      </g>
      {/* S-Pen Stylus Tip Vector */}
      <path d="M60 84 L64 74 L68 76 Z" fill="#d49e42" />
      {/* Specs Badges */}
      <text x="60" y="30" fill="#f5e6a3" fontSize="6.5" fontWeight="bold" letterSpacing="0.5" textAnchor="middle" fontFamily="sans-serif">1-120 Hz LTPO · 3,200 NITS</text>
      <text x="60" y="103" fill="#d49e42" fontSize="5.5" fontWeight="bold" letterSpacing="0.6" textAnchor="middle" fontFamily="sans-serif">WACOM EMR DIGITIZER · UTG</text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Main GalaxyFoldShowcase Component                                          */
/* -------------------------------------------------------------------------- */

export default function GalaxyFoldShowcase({
  locale,
  initialModel = "fold8",
}: GalaxyFoldShowcaseProps) {
  const isDe = locale === "de";
  const [, startTransition] = useTransition();

  const [selectedModel, setSelectedModel] = useState<SamsungModelId>(initialModel);
  const [viewMode, setViewMode] = useState<ViewMode>(initialModel === "ultra" ? "unfolded" : "unfolded");
  const [selectedFinishIndex, setSelectedFinishIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isFullscreenNative, setIsFullscreenNative] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stageRef = useRef<HTMLDivElement>(null);
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

  // Synchronize native fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenNative(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard navigation & lock body scroll during lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        setZoomLevel(1);
      }
      if (e.key === "ArrowRight") {
        setSelectedFinishIndex((prev) => (prev + 1) % activeFinishes.length);
      }
      if (e.key === "ArrowLeft") {
        setSelectedFinishIndex((prev) => (prev - 1 + activeFinishes.length) % activeFinishes.length);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, activeFinishes.length]);

  // Toggle true native fullscreen API
  const handleToggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (stageRef.current) {
          await stageRef.current.requestFullscreen();
        } else {
          await document.documentElement.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback to in-page lightbox modal
      setLightboxOpen(true);
    }
  };

  // Determine current active visual asset based on model and view mode
  const getActiveAsset = () => {
    if (viewMode === "video") {
      return { type: "video" as const, src: "/images/samsung/zfold8/galaxy-z-fold8-design.mp4" };
    }
    if (viewMode === "lineup") {
      return {
        type: "image" as const,
        src: "/images/samsung/zfold8/banner-dual-desktop.webp",
        alt: isDe
          ? "Samsung Galaxy Z Fold8 & Z Fold8 Ultra Flaggschiff Lineup"
          : "Samsung Galaxy Z Fold8 & Z Fold8 Ultra Flagship Lineup",
        labelDe: "Lineup: Fold8 (4,5 mm) vs. Fold8 Ultra (8,0 Zoll)",
        labelEn: "Lineup: Fold8 (4.5mm) vs. Fold8 Ultra (8.0-inch)",
      };
    }
    if (viewMode === "profile") {
      return {
        type: "image" as const,
        src: "/images/samsung/zfold8/phone-fold.webp",
        alt: isDe
          ? "Samsung Galaxy Z Fold8 gefaltetes Profil mit Zero-Gap Scharnier"
          : "Samsung Galaxy Z Fold8 folded slim profile with zero-gap hinge",
        labelDe: "Gefaltetes Ultra-Slim Profil (Zero-Gap Scharnier)",
        labelEn: "Folded Ultra-Slim Profile (Zero-Gap Hinge)",
      };
    }
    if (viewMode === "unfolded") {
      if (selectedModel === "ultra") {
        return {
          type: "image" as const,
          src: "/images/samsung/zfold8/phone-ultra.webp",
          alt: isDe
            ? "Samsung Galaxy Z Fold8 Ultra – 8,0 Zoll Display entfaltet"
            : "Samsung Galaxy Z Fold8 Ultra – 8.0-inch Canvas Unfolded",
          labelDe: "Galaxy Z Fold8 Ultra – 8,0\" Dynamic LTPO AMOLED 2X entfaltet",
          labelEn: "Galaxy Z Fold8 Ultra – 8.0\" Dynamic LTPO AMOLED 2X Unfolded",
        };
      }
      return {
        type: "image" as const,
        src: "/images/samsung/zfold8/preview.webp",
        alt: isDe
          ? "Samsung Galaxy Z Fold8 – 7,6 Zoll Display entfaltet"
          : "Samsung Galaxy Z Fold8 – 7.6-inch Canvas Unfolded",
        labelDe: "Galaxy Z Fold8 – 7,6\" Dynamic LTPO AMOLED 2X entfaltet",
        labelEn: "Galaxy Z Fold8 – 7.6\" Dynamic LTPO AMOLED 2X Unfolded",
      };
    }
    // "colors" mode
    return {
      type: "image" as const,
      src: currentFinish.src,
      alt: `Samsung Galaxy ${selectedModel === "fold8" ? "Z Fold8" : "Z Fold8 Ultra"} — ${
        isDe ? currentFinish.nameDe : currentFinish.nameEn
      }`,
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
      <section className="sticky top-14 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md py-3">
        <div className="container-page flex items-center justify-center">
          <div className="inline-flex p-1 rounded-full border border-border bg-surface/80 max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSelectModel("fold8")}
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[38px] ${
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
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[38px] ${
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
      <section className="py-10 md:py-16" ref={stageRef}>
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
                  ? "Interaktive Galerie mit hochauflösenden Ansichten, Farbwechsel und Vollbildmodus"
                  : "Interactive high-resolution showcase with fluid color transitions and fullscreen inspection"}
              </p>
            </div>

            {/* View Selector Pills (Responsive horizontal scroll) */}
            <div className={`flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-surface p-1 text-xs ${s.noScrollbar}`}>
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

              {/* 2. Color Variants */}
              <button
                type="button"
                onClick={() => setViewMode("colors")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "colors" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {isDe ? "Farben (360°)" : "Color Finishes"}
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
                {/* Large Product Render Container */}
                <div className={`relative w-full max-w-3xl h-[360px] sm:h-[480px] md:h-[560px] lg:h-[620px] flex items-center justify-center ${s.stageImageAnimated}`} key={`${selectedModel}-${viewMode}-${selectedFinishIndex}`}>
                  <Image
                    src={activeAsset.src}
                    alt={activeAsset.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)] transition-all duration-500"
                    priority
                  />
                </div>

                {/* Subtitle / Asset Title */}
                <div className="text-center space-y-3 z-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-4 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md shadow-sm">
                    {viewMode === "colors" && (
                      <span
                        className="size-2.5 rounded-full transition-colors duration-500"
                        style={{ backgroundColor: currentFinish.colorHex }}
                      />
                    )}
                    <span>{isDe ? activeAsset.labelDe : activeAsset.labelEn}</span>
                  </div>

                  {/* Interactive Color Switcher with Tactile Buttons (Active in "colors" mode or whenever finishes apply) */}
                  {viewMode === "colors" && (
                    <div className="space-y-2">
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

                      <p className="text-[11px] text-muted">
                        {isDe ? currentFinish.badgeDe : currentFinish.badgeEn}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stage Quick Controls: Fullscreen Lightbox & Native Fullscreen Toggle */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleNativeFullscreen}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-2 text-xs font-medium text-foreground backdrop-blur-md transition hover:border-gold hover:text-gold shadow-sm min-h-[38px]"
                title={isDe ? "Im Vollbildmodus ansehen (Native API)" : "View in native browser fullscreen"}
                aria-label={isDe ? "Vollbildmodus aktivieren" : "Activate native fullscreen"}
              >
                {isFullscreenNative ? <MinimizeIcon className="size-3.5" /> : <ExpandIcon className="size-3.5" />}
                <span>{isFullscreenNative ? (isDe ? "Beenden" : "Exit Fullscreen") : (isDe ? "Display-Vollbild" : "Native Fullscreen")}</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-surface px-4 py-2 text-xs font-semibold text-gold backdrop-blur-md transition hover:bg-gold hover:text-black shadow-md min-h-[38px]"
                aria-label={isDe ? "Theater-Vollbild öffnen" : "Open Theater Fullscreen Modal"}
              >
                <ExpandIcon className="size-3.5" />
                <span>{isDe ? "Vollbild-Galerie" : "Fullscreen Theater"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Silicon & Engineering Hardware Architecture Section with Bespoke SVGs */}
      <section className="border-t border-border/80 bg-surface/20 py-16">
        <div className="container-page">
          <div className="mb-12 text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              {isDe ? "Ingenieurskunst & Prozessorarchitektur" : "Engineering & Silicon Architecture"}
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl text-foreground font-sans">
              {isDe ? "Die 4 Schlüssel-Innovationen der Z Fold8 Serie" : "The 4 Core Innovations of the Z Fold8 Series"}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {isDe
                ? "Detaillierte Einblicke in Prozessor-Halbleiter, optische Sensortechnik, Scharnier-Mechanik und LTPO-Displaymatrix."
                : "Deep architectural breakdown of 3nm silicon, periscope optical sensor suite, zero-gap hinge dynamics, and LTPO display physics."}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Architecture Card 1: Snapdragon 8 Elite Gen 5 */}
            <div className={`rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-gold/50 ${s.glassCard}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gold/10 border border-gold/20">
                    <SnapdragonCpuSvg className="size-14" />
                  </div>
                  <span className="text-[11px] font-bold text-gold border border-gold/30 bg-gold/10 px-2.5 py-1 rounded-full">
                    3nm TSMC N3E
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Snapdragon 8 Elite Gen 5
                  </h3>
                  <p className="text-xs font-medium text-gold">
                    4,32 GHz Oryon CPU · 45 TOPS NPU
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Maßgeschneiderter 3nm-Halbleiter mit dediziertem Hexagon Tensor-Prozessor. Ermöglicht Live-Dolmetschen, Galaxy AI Echtzeit-Transkription und bis zu 40% mehr Grafikleistung."
                    : "Custom 3nm silicon fabricated with dual 4.32GHz Oryon Prime cores and dedicated Hexagon NPU. Powers on-device Galaxy AI translation and desktop-grade gaming."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span>{isDe ? "Architektur" : "Architecture"}</span>
                <span className="font-semibold text-foreground">Oryon + Adreno 830</span>
              </div>
            </div>

            {/* Architecture Card 2: 200 MP ISOCELL ProVisual Sensor */}
            <div className={`rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-gold/50 ${s.glassCard}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gold/10 border border-gold/20">
                    <IsocellCameraSvg className="size-14" />
                  </div>
                  <span className="text-[11px] font-bold text-gold border border-gold/30 bg-gold/10 px-2.5 py-1 rounded-full">
                    200 MP · 1/1.3&quot;
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    {isDe ? "200 MP ISOCELL ProVisual" : "200MP ISOCELL ProVisual"}
                  </h3>
                  <p className="text-xs font-medium text-gold">
                    Tetra2pixel · 5x Periskop Zoom
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Erstmals in einem Foldable: Der 200 MP Hauptsensor mit f/1.7 Blende fängt bis zu 60% mehr Licht ein. Gekoppelt mit 5x optischem Periskop-Telezoom für gestochen scharfe Aufnahmen bis 100x Space Zoom."
                    : "First time in a foldable: 200MP sensor with f/1.7 aperture and Tetra2pixel binning captures 60% more photons. Paired with a 5x optical periscope lens for up to 100x Space Zoom."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span>{isDe ? "Optische Stabilisierung" : "Optical Stabilization"}</span>
                <span className="font-semibold text-foreground">4-Achsen OIS Gyro</span>
              </div>
            </div>

            {/* Architecture Card 3: Flex Teardrop Zero-Gap Precision Hinge */}
            <div className={`rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-gold/50 ${s.glassCard}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gold/10 border border-gold/20">
                    <FlexHingeSvg className="size-14" />
                  </div>
                  <span className="text-[11px] font-bold text-green border border-green/30 bg-green/10 px-2.5 py-1 rounded-full">
                    0.0 mm Falz
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    {isDe ? "Flex Zero-Gap Scharnier" : "Flex Zero-Gap Hinge"}
                  </h3>
                  <p className="text-xs font-medium text-gold">
                    Grade 5 Titan · IP48 Wasserfest
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Doppelspuren-Planetengetriebe mit patentiertem Wassertropfen-Radius. Schließt absolut bündig ohne Zwischenraum und minimiert die Displayfalte auf ein haptisch kaum wahrnehmbares Niveau."
                    : "Dual-rail planetary gear assembly with waterdrop teardrop geometry. Closes perfectly flush with zero gap, reducing the inner screen crease to an imperceptible level."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span>{isDe ? "Dauerhaltbarkeit" : "Durability Test"}</span>
                <span className="font-semibold text-foreground">300.000 Faltungen</span>
              </div>
            </div>

            {/* Architecture Card 4: Dynamic LTPO AMOLED 2X Display */}
            <div className={`rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-gold/50 ${s.glassCard}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gold/10 border border-gold/20">
                    <AmoledDisplaySvg className="size-14" />
                  </div>
                  <span className="text-[11px] font-bold text-gold border border-gold/30 bg-gold/10 px-2.5 py-1 rounded-full">
                    3.200 Nits · LTPO
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Dynamic LTPO AMOLED 2X
                  </h3>
                  <p className="text-xs font-medium text-gold">
                    1-120 Hz variabel · Wacom EMR
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Brillantes Display mit Ultra-Thin-Glass (UTG) und flexibler Bildwiederholrate von 1 Hz bis 120 Hz. Beim Fold8 Ultra mit integriertem Wacom-Digitizer für reflexionsfreie S-Pen Handschrift."
                    : "Stunning canvas featuring Ultra-Thin Glass (UTG) and variable refresh rates from 1Hz to 120Hz. Fold8 Ultra includes integrated Wacom digitizer for natural S-Pen handwriting."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span>{isDe ? "Farbraumabdeckung" : "Color Space"}</span>
                <span className="font-semibold text-foreground">100% DCI-P3</span>
              </div>
            </div>
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

      {/* High-Resolution Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={isDe ? "Vollbildansicht" : "Fullscreen Theater View"}
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between z-20 pb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">
                Samsung Galaxy {selectedModel === "fold8" ? "Z Fold8" : "Z Fold8 Ultra"}
              </span>
              <span className="text-xs text-white/60 hidden sm:inline">
                {isDe ? activeAsset.labelDe : activeAsset.labelEn}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Buttons */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition min-h-[44px] min-w-[44px]"
                title={isDe ? "Zoom umschalten (1x / 1.5x / 2x)" : "Toggle Zoom (1x / 1.5x / 2x)"}
                aria-label={isDe ? "Zoom vergrößern" : "Zoom in"}
              >
                {zoomLevel > 1 ? <ZoomOutIcon className="size-4" /> : <ZoomInIcon className="size-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false);
                  setZoomLevel(1);
                }}
                className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500/80 transition min-h-[44px] min-w-[44px]"
                aria-label={isDe ? "Schließen" : "Close"}
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
          </div>

          {/* Central Expansive Stage */}
          <div className="relative flex-1 flex items-center justify-center overflow-auto w-full my-auto">
            {activeAsset.type === "video" ? (
              <div className="relative w-full max-w-5xl aspect-[16/9] max-h-[80vh]">
                <video
                  src={activeAsset.src}
                  autoPlay
                  controls
                  className="w-full h-full object-contain rounded-xl shadow-2xl"
                />
              </div>
            ) : (
              <div
                className="relative w-full max-w-5xl h-[70vh] sm:h-[80vh] flex items-center justify-center transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <Image
                  src={activeAsset.src}
                  alt={activeAsset.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>

          {/* Bottom Bar: Quick Finishes & View Swapping */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 z-20">
            {/* View Switcher in Modal */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs max-w-full">
              <button
                type="button"
                onClick={() => setViewMode("unfolded")}
                className={`px-3 py-1.5 rounded-lg font-medium transition min-h-[36px] ${
                  viewMode === "unfolded" ? "bg-white text-black" : "text-white/70 hover:text-white bg-white/10"
                }`}
              >
                {selectedModel === "ultra" ? (isDe ? "8,0\" Entfaltet" : "8.0\" Unfolded") : (isDe ? "7,6\" Entfaltet" : "7.6\" Unfolded")}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("colors")}
                className={`px-3 py-1.5 rounded-lg font-medium transition min-h-[36px] ${
                  viewMode === "colors" ? "bg-white text-black" : "text-white/70 hover:text-white bg-white/10"
                }`}
              >
                {isDe ? "Farben" : "Colors"}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("profile")}
                className={`px-3 py-1.5 rounded-lg font-medium transition min-h-[36px] ${
                  viewMode === "profile" ? "bg-white text-black" : "text-white/70 hover:text-white bg-white/10"
                }`}
              >
                {isDe ? "Profil" : "Profile"}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("lineup")}
                className={`px-3 py-1.5 rounded-lg font-medium transition min-h-[36px] ${
                  viewMode === "lineup" ? "bg-white text-black" : "text-white/70 hover:text-white bg-white/10"
                }`}
              >
                Lineup
              </button>
            </div>

            {/* Swatch Switcher in Modal */}
            <div className="flex items-center gap-3">
              {activeFinishes.map((finish, idx) => (
                <button
                  key={finish.id}
                  type="button"
                  onClick={() => {
                    setSelectedFinishIndex(idx);
                    setViewMode("colors");
                  }}
                  className={`size-8 rounded-full border-2 transition-all min-h-[36px] min-w-[36px] ${
                    idx === selectedFinishIndex && viewMode === "colors"
                      ? "border-white scale-125 shadow-lg"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: finish.colorHex }}
                  title={isDe ? finish.nameDe : finish.nameEn}
                  aria-label={isDe ? finish.nameDe : finish.nameEn}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
