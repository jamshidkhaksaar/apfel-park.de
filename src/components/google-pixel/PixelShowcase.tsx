"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  src: string;
  badgeDe: string;
  badgeEn: string;
};

type ViewMode = "colors" | "unfolded" | "profile" | "video";

const PIXEL11_FINISHES: Finish[] = [
  {
    id: "frost",
    nameDe: "Frost White",
    nameEn: "Frost White",
    colorHex: "#e9e6df",
    src: "/images/google/pixel11/pixel-frost.webp",
    badgeDe: "Sanftes Mattweiß",
    badgeEn: "Soft Matte White",
  },
  {
    id: "hibiscus",
    nameDe: "Hibiscus Pink",
    nameEn: "Hibiscus Pink",
    colorHex: "#e5a3b5",
    src: "/images/google/pixel11/pixel-hibiscus.webp",
    badgeDe: "Lebendiger Farbton 2026",
    badgeEn: "Vibrant Tone 2026",
  },
  {
    id: "pistachio",
    nameDe: "Pistachio Green",
    nameEn: "Pistachio Green",
    colorHex: "#b9d9a8",
    src: "/images/google/pixel11/pixel-pistachio.webp",
    badgeDe: "Natürliche Eleganz",
    badgeEn: "Natural Elegance",
  },
  {
    id: "obsidian",
    nameDe: "Obsidian Black",
    nameEn: "Obsidian Black",
    colorHex: "#2b2c2e",
    src: "/images/google/pixel11/pixel-obsidian.webp",
    badgeDe: "Tiefes Vulkanglas-Schwarz",
    badgeEn: "Deep Volcanic Black",
  },
];

const FOLD_FINISHES: Finish[] = [
  {
    id: "olive",
    nameDe: "Olive Haze",
    nameEn: "Olive Haze",
    colorHex: "#8a8a5c",
    src: "/images/google/pixel11/fold-olive.webp",
    badgeDe: "Signature Edition",
    badgeEn: "Signature Edition",
  },
  {
    id: "obsidian",
    nameDe: "Obsidian Black",
    nameEn: "Obsidian Black",
    colorHex: "#2b2c2e",
    src: "/images/google/pixel11/fold-obsidian.webp",
    badgeDe: "Satiniertes Glas & Stahl",
    badgeEn: "Satin Glass & Steel",
  },
];

const VIDEO_TRACKS = [
  { src: "/images/google/pixel11/pixel-hero.mp4", nameDe: "Pixel 11 Offizieller Spot", nameEn: "Pixel 11 Official Spot" },
  { src: "/images/google/pixel11/pixel-magic.mp4", nameDe: "Magic Capture & AI", nameEn: "Magic Capture & AI" },
  { src: "/images/google/pixel11/fold-video.mp4", nameDe: "Pro Fold Design & Scharnier", nameEn: "Pro Fold Design & Hinge" },
];

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
/* Hardware Architecture SVGs                                                 */
/* -------------------------------------------------------------------------- */

function GoogleTensorCpuSvg({ className = "size-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tensorBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285f4" />
          <stop offset="50%" stopColor="#2866d7" />
          <stop offset="100%" stopColor="#1a4fb0" />
        </linearGradient>
        <linearGradient id="tensorDie" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e2229" />
          <stop offset="100%" stopColor="#0f131a" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="104" height="104" rx="10" fill="#13171e" stroke="url(#tensorBlueGrad)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2.5" fill="#4285f4" />
      <circle cx="104" cy="16" r="2.5" fill="#ea4335" />
      <circle cx="104" cy="104" r="2.5" fill="#34a853" />
      <circle cx="16" cy="104" r="2.5" fill="#fbbc05" />
      <g stroke="#4285f4" strokeWidth="1.2" opacity="0.65">
        <line x1="30" y1="4" x2="30" y2="8" /><line x1="44" y1="4" x2="44" y2="8" />
        <line x1="58" y1="4" x2="58" y2="8" /><line x1="72" y1="4" x2="72" y2="8" />
        <line x1="86" y1="4" x2="86" y2="8" />
        <line x1="30" y1="112" x2="30" y2="116" /><line x1="44" y1="112" x2="44" y2="116" />
        <line x1="58" y1="112" x2="58" y2="116" /><line x1="72" y1="112" x2="72" y2="116" />
        <line x1="86" y1="112" x2="86" y2="116" />
        <line x1="4" y1="30" x2="8" y2="30" /><line x1="4" y1="44" x2="8" y2="44" />
        <line x1="4" y1="58" x2="8" y2="58" /><line x1="4" y1="72" x2="8" y2="72" />
        <line x1="4" y1="86" x2="8" y2="86" />
        <line x1="112" y1="30" x2="116" y2="30" /><line x1="112" y1="44" x2="116" y2="44" />
        <line x1="112" y1="58" x2="116" y2="58" /><line x1="112" y1="72" x2="116" y2="72" />
        <line x1="112" y1="86" x2="116" y2="86" />
      </g>
      <rect x="24" y="24" width="72" height="72" rx="6" fill="url(#tensorDie)" stroke="rgba(66, 133, 244, 0.4)" strokeWidth="1" />
      <rect x="30" y="30" width="34" height="24" rx="2" fill="rgba(66, 133, 244, 0.22)" stroke="#4285f4" strokeWidth="0.8" />
      <text x="47" y="42" fill="#7fa2d6" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Google TPU</text>
      <text x="47" y="49" fill="#93c5fd" fontSize="5.5" textAnchor="middle" fontFamily="sans-serif">Gemini Nano</text>
      <rect x="68" y="30" width="22" height="24" rx="2" fill="rgba(52, 168, 83, 0.18)" stroke="#34a853" strokeWidth="0.8" />
      <text x="79" y="42" fill="#86efac" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Titan M3</text>
      <text x="79" y="49" fill="#86efac" fontSize="5" textAnchor="middle" fontFamily="sans-serif">Security</text>
      <rect x="30" y="58" width="60" height="18" rx="2" fill="rgba(251, 188, 5, 0.15)" stroke="#fbbc05" strokeWidth="0.8" />
      <text x="60" y="70" fill="#fde047" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">1+3+4 ARMv9.2 CPU Cores</text>
      <text x="60" y="87" fill="#ffffff" fontSize="6" fontWeight="bold" letterSpacing="0.8" textAnchor="middle" fontFamily="sans-serif">3nm TSMC N3P · LPDDR5X</text>
    </svg>
  );
}

function PixelPeriscopeCameraSvg({ className = "size-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cameraVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#252427" />
          <stop offset="100%" stopColor="#121214" />
        </linearGradient>
        <radialGradient id="lensReflect" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(66, 133, 244, 0.5)" />
          <stop offset="60%" stopColor="rgba(52, 168, 83, 0.2)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="8" y="24" width="104" height="72" rx="14" fill="url(#cameraVisorGrad)" stroke="#4285f4" strokeWidth="1.2" />
      <rect x="14" y="32" width="92" height="56" rx="10" fill="#000000" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
      <circle cx="36" cy="60" r="18" fill="#15171c" stroke="#4285f4" strokeWidth="1.2" />
      <circle cx="36" cy="60" r="12" fill="url(#lensReflect)" stroke="#7fa2d6" strokeWidth="0.8" />
      <circle cx="36" cy="60" r="5" fill="#000" />
      <text x="36" y="85" fill="#7fa2d6" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">50MP Quad PD</text>
      <rect x="68" y="44" width="28" height="28" rx="4" fill="#15171c" stroke="#fbbc05" strokeWidth="1.2" />
      <line x1="72" y1="48" x2="92" y2="68" stroke="#fbbc05" strokeWidth="1.5" strokeLinecap="round" />
      <text x="82" y="85" fill="#fde047" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">5X OPTICAL</text>
      <circle cx="60" cy="54" r="2.5" fill="#ea4335" />
      <circle cx="60" cy="66" r="1.5" fill="#34a853" />
    </svg>
  );
}

function PixelFrictionHingeSvg({ className = "size-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="steelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="100" height="100" rx="12" fill="#10141a" stroke="rgba(66, 133, 244, 0.3)" strokeWidth="1.2" />
      <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8">
        <line x1="10" y1="35" x2="110" y2="35" /><line x1="10" y1="60" x2="110" y2="60" /><line x1="10" y1="85" x2="110" y2="85" />
        <line x1="35" y1="10" x2="35" y2="110" /><line x1="60" y1="10" x2="60" y2="110" /><line x1="85" y1="10" x2="85" y2="110" />
      </g>
      <path d="M22 46 L50 46 L50 74 L22 74 Z" fill="#1e2430" stroke="url(#steelGrad)" strokeWidth="1.2" />
      <path d="M70 46 L98 46 L98 74 L70 74 Z" fill="#1e2430" stroke="url(#steelGrad)" strokeWidth="1.2" />
      <circle cx="55" cy="60" r="7" fill="#2d3748" stroke="#4285f4" strokeWidth="1.2" />
      <circle cx="55" cy="60" r="2.5" fill="#4285f4" />
      <circle cx="65" cy="60" r="7" fill="#2d3748" stroke="#4285f4" strokeWidth="1.2" />
      <circle cx="65" cy="60" r="2.5" fill="#4285f4" />
      <path d="M52 30 L68 30 M60 25 L60 35" stroke="#34a853" strokeWidth="1.5" strokeLinecap="round" />
      <text x="60" y="22" fill="#34a853" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">0.0 mm FLAT FOLD</text>
      <text x="60" y="98" fill="#7fa2d6" fontSize="5.5" fontWeight="bold" letterSpacing="0.8" textAnchor="middle" fontFamily="sans-serif">AEROSPACE STEEL · IPX8</text>
    </svg>
  );
}

function SuperActuaDisplaySvg({ className = "size-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="actuaGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4285f4" />
          <stop offset="33%" stopColor="#ea4335" />
          <stop offset="66%" stopColor="#fbbc05" />
          <stop offset="100%" stopColor="#34a853" />
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="96" height="96" rx="10" fill="#0c1017" stroke="url(#actuaGlow)" strokeWidth="1.5" />
      <path
        d="M20 54 Q28 30 36 54 T52 54 T68 54 T84 54 T100 54"
        fill="none"
        stroke="#4285f4"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.8">
        <rect x="22" y="68" width="76" height="24" rx="3" fill="rgba(255, 255, 255, 0.02)" />
        <line x1="32" y1="68" x2="32" y2="92" /><line x1="44" y1="68" x2="44" y2="92" />
        <line x1="56" y1="68" x2="56" y2="92" /><line x1="68" y1="68" x2="68" y2="92" />
        <line x1="80" y1="68" x2="80" y2="92" />
      </g>
      <text x="60" y="30" fill="#93c5fd" fontSize="6.5" fontWeight="bold" letterSpacing="0.5" textAnchor="middle" fontFamily="sans-serif">1-120 Hz LTPO · 3,000 NITS</text>
      <text x="60" y="103" fill="#60a5fa" fontSize="5.5" fontWeight="bold" letterSpacing="0.6" textAnchor="middle" fontFamily="sans-serif">SUPER ACTUA FLEX · UTG</text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* PixelShowcase Component                                                    */
/* -------------------------------------------------------------------------- */

export default function PixelShowcase({
  locale,
  initialModel = "pixel11",
}: PixelShowcaseProps) {
  const isDe = locale === "de";
  const [, startTransition] = useTransition();

  const [selectedModel, setSelectedModel] = useState<PixelModelId>(initialModel);
  const [viewMode, setViewMode] = useState<ViewMode>("colors");
  const [selectedFinishIndex, setSelectedFinishIndex] = useState(0);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isFullscreenNative, setIsFullscreenNative] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeFinishes = selectedModel === "pixel11" ? PIXEL11_FINISHES : FOLD_FINISHES;
  const currentFinish = activeFinishes[selectedFinishIndex] || activeFinishes[0];
  const currentVideo = VIDEO_TRACKS[activeVideoIdx];

  const handleSelectModel = (model: PixelModelId) => {
    startTransition(() => {
      setSelectedModel(model);
      setSelectedFinishIndex(0);
      setViewMode("colors");
    });
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenNative(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard navigation & body lock during lightbox
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
      setLightboxOpen(true);
    }
  };

  const getActiveAsset = () => {
    if (viewMode === "video") {
      return {
        type: "video" as const,
        src: currentVideo.src,
        alt: isDe ? currentVideo.nameDe : currentVideo.nameEn,
        labelDe: currentVideo.nameDe,
        labelEn: currentVideo.nameEn,
      };
    }
    if (viewMode === "unfolded") {
      return {
        type: "image" as const,
        src:
          selectedModel === "proFold"
            ? "/images/google/pixel11/fold-olive.webp"
            : "/images/google/pixel11/pixel-frost.webp",
        alt:
          selectedModel === "proFold"
            ? isDe
              ? "Google Pixel 11 Pro Fold – 8,0 Zoll Super Actua Flex Display entfaltet"
              : "Google Pixel 11 Pro Fold – 8.0-inch Super Actua Flex Canvas Unfolded"
            : isDe
            ? "Google Pixel 11 – 6,3 Zoll Actua OLED Display"
            : "Google Pixel 11 – 6.3-inch Actua OLED Display",
        labelDe:
          selectedModel === "proFold"
            ? "8,0\" Super Actua Flex Display entfaltet"
            : "6,3\" Actua OLED Display",
        labelEn:
          selectedModel === "proFold"
            ? "8.0\" Super Actua Flex Canvas Unfolded"
            : "6.3\" Actua OLED Display",
      };
    }
    if (viewMode === "profile") {
      return {
        type: "image" as const,
        src:
          selectedModel === "proFold"
            ? "/images/google/pixel11/fold-obsidian.webp"
            : "/images/google/pixel11/pixel-obsidian.webp",
        alt: isDe ? "Google Pixel 11 ultra-dünnes Profil" : "Google Pixel 11 ultra-slim profile",
        labelDe:
          selectedModel === "proFold"
            ? "5,1 mm Schlankprofil & Zahnradscharnier"
            : "8,5 mm Aluminium-Präzisionsprofil",
        labelEn:
          selectedModel === "proFold"
            ? "5.1mm Slim Profile & Gear Hinge"
            : "8.5mm Aluminum Precision Profile",
      };
    }
    // "colors" mode
    return {
      type: "image" as const,
      src: currentFinish.src,
      alt: `Google ${selectedModel === "pixel11" ? "Pixel 11" : "Pixel 11 Pro Fold"} — ${
        isDe ? currentFinish.nameDe : currentFinish.nameEn
      }`,
      labelDe: `${currentFinish.nameDe} · ${isDe ? currentFinish.badgeDe : currentFinish.badgeEn}`,
      labelEn: `${currentFinish.nameEn} · ${isDe ? currentFinish.badgeDe : currentFinish.badgeEn}`,
    };
  };

  const activeAsset = getActiveAsset();

  // WhatsApp link
  const waText = encodeURIComponent(
    isDe
      ? `Guten Tag Apfel Park Team, ich interessiere mich für das Google ${
          selectedModel === "pixel11"
            ? "Pixel 11 (Tensor G5 3nm)"
            : "Pixel 11 Pro Fold (8 Zoll Super Actua Flex)"
        } in der Farbe ${currentFinish.nameDe}. Bitte senden Sie mir ein Angebot und Infos zur Verfügbarkeit in Hamburg.`
      : `Hello Apfel Park Team, I am inquiring about the Google ${
          selectedModel === "pixel11"
            ? "Pixel 11 (Tensor G5 3nm)"
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
    {
      category: isDe ? "Formfaktor & Abmessungen" : "Form Factor & Dimensions",
      pixel11: isDe ? "152,8 x 72,0 x 8,5 mm · 198g Gewicht · 100% recyceltes Aluminium" : "152.8 x 72.0 x 8.5 mm · 198g weight · 100% recycled aluminum",
      proFold: isDe ? "5,1 mm entfaltet · 10,5 mm gefaltet · 257g · Hochfester Stahl & Titan" : "5.1 mm unfolded · 10.5 mm folded · 257g · High-strength steel & titanium",
    },
    {
      category: isDe ? "Hauptdisplay" : "Main Canvas",
      pixel11: isDe ? "6,3\" Actua OLED · 60-120 Hz · Bis zu 2.700 Nits Spitzenhelligkeit · 1080 x 2424" : "6.3\" Actua OLED · 60-120 Hz · Up to 2,700 nits peak · 1080 x 2424",
      proFold: isDe ? "8,0\" Super Actua Flex LTPO OLED · 1-120 Hz · Bis zu 3.000 Nits · Ultra Thin Glass" : "8.0\" Super Actua Flex LTPO OLED · 1-120 Hz · Up to 3,000 nits · Ultra Thin Glass",
    },
    {
      category: isDe ? "Cover-Display (Außen)" : "Cover Display (Outer)",
      pixel11: isDe ? "Integriertes 6,3\" Display" : "Integrated 6.3\" display",
      proFold: isDe ? "6,3\" Actua OLED · 120 Hz · 2.700 Nits · 20:9 klassisches Seitenverhältnis" : "6.3\" Actua OLED · 120 Hz · 2,700 nits · 20:9 standard aspect ratio",
    },
    {
      category: isDe ? "Prozessor & KI-Silizium" : "Processor & AI Silicon",
      pixel11: "Google Tensor G5 (3nm TSMC N3P) · Titan M3 Sicherheits-Chip · Gemini Nano",
      proFold: "Google Tensor G5 (3nm TSMC N3P) · Titan M3 Chip · Gemini Live Multi-Modal",
    },
    {
      category: isDe ? "Kamerasystem" : "Camera Suite",
      pixel11: isDe ? "Duales System: 50 MP Quad PD Weitwinkel (f/1.68, OIS) + 48 MP Ultraweit mit Makro-Fokus" : "Dual Suite: 50MP Quad PD Wide (f/1.68, OIS) + 48MP Ultra-Wide with Macro Focus",
      proFold: isDe ? "Triple Pro System: 48 MP Quad PD Weitwinkel (f/1.7, OIS) + 10,5 MP Ultraweit + 10,8 MP 5x Periskop-Tele (20x Super Res Zoom)" : "Triple Pro Suite: 48MP Quad PD Wide (f/1.7, OIS) + 10.5MP Ultra-Wide + 10.8MP 5x Periscope Telephoto (20x Super Res Zoom)",
    },
    {
      category: isDe ? "Arbeitsspeicher & Speicher" : "Memory & Storage",
      pixel11: "12 GB LPDDR5X · 128 GB / 256 GB UFS 3.1",
      proFold: "16 GB LPDDR5X · 256 GB / 512 GB UFS 4.0",
    },
    {
      category: isDe ? "Akku & Schnellladung" : "Battery & Charging",
      pixel11: isDe ? "4.700 mAh · 30W Schnellladung · Qi2 Wireless Charging · Bis zu 100 Std. Extrem-Energiesparmodus" : "4,700 mAh · 30W fast charging · Qi2 wireless charging · Up to 100h Extreme Battery Saver",
      proFold: isDe ? "4.650 mAh Split-Akku · 30W Schnellladung · Kabelloses Laden" : "4,650 mAh split dual-battery · 30W fast charging · Wireless charging",
    },
    {
      category: isDe ? "Updates & Schutzklasse" : "Support & Durability",
      pixel11: isDe ? "7 Jahre OS-, Sicherheits- & Feature Drop-Updates · IP68 staub- & wasserdicht" : "7 years OS, security & Feature Drop updates · IP68 water & dust resistant",
      proFold: isDe ? "7 Jahre OS- & Sicherheits-Updates · IPX8 wasserbeständig · Reibungsfreies Zahnradscharnier" : "7 years OS & security updates · IPX8 water resistant · Fluid frictionless gear hinge",
    },
  ];

  // FAQ list
  const faqs = [
    {
      qDe: "Wann sind Google Pixel 11 und Pixel 11 Pro Fold in Deutschland erhältlich?",
      qEn: "When are Google Pixel 11 and Pixel 11 Pro Fold available in Germany?",
      aDe: "Die Google Pixel 11 Generation ist offiziell bei Apfel Park Hamburg bestellbar. Alle Geräte sind vertragsfrei, ohne SIM-Lock und sofort mit allen Anbietern einsatzbereit.",
      aEn: "The Google Pixel 11 generation is available for purchase at Apfel Park Hamburg. All devices are factory unlocked without SIM-lock for immediate worldwide carrier compatibility.",
    },
    {
      qDe: "Was zeichnet den neuen Google Tensor G5 Prozessor aus?",
      qEn: "What makes the new Google Tensor G5 processor special?",
      aDe: "Der Tensor G5 wird erstmals im modernen 3nm-Verfahren von TSMC gefertigt. Er bietet dramatisch gesteigerte Energieeffizienz und treibt Googles modernste On-Device Gemini Nano Modelle für Echtzeit-Fotobearbeitung und Übersetzung an.",
      aEn: "Tensor G5 is manufactured on TSMC's cutting-edge 3nm process. It delivers significant thermal efficiency gains and powers on-device Gemini Nano AI for instantaneous computational photography and translation.",
    },
    {
      qDe: "Welche Farbvarianten sind für Google Pixel 11 erhältlich?",
      qEn: "Which color finishes are available for Google Pixel 11?",
      aDe: "Das Pixel 11 ist in Frost White, Hibiscus Pink, Pistachio Green und Obsidian Black erhältlich. Das Pixel 11 Pro Fold bietet die Signature-Farben Olive Haze und Obsidian Black.",
      aEn: "Pixel 11 is available in Frost White, Hibiscus Pink, Pistachio Green, and Obsidian Black. Pixel 11 Pro Fold features signature Olive Haze and Obsidian Black finishes.",
    },
    {
      qDe: "Wie lange garantiert Google Software- und Sicherheitsupdates?",
      qEn: "How long does Google guarantee software and security updates?",
      aDe: "Google bietet für die Pixel 11 Serie volle 7 Jahre garantierte Android-Betriebssystem-Updates, Sicherheitspatches und regelmäßige Pixel Feature Drops.",
      aEn: "Google guarantees 7 full years of Android operating system upgrades, security patches, and regular Pixel Feature Drops for the Pixel 11 lineup.",
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
            <span>{isDe ? "Hamburg Boutique & bundesweiter Expressversand" : "Hamburg Boutique & Nationwide Express Shipping"}</span>
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
                    {isDe ? "Dein Alltag. Neu gedacht mit Tensor G5." : "Everyday Magic. Reimagined with Tensor G5."}
                  </span>
                </>
              ) : (
                <>
                  Pixel 11 Pro Fold
                  <span className="block text-xl sm:text-3xl lg:text-4xl font-medium text-muted mt-2">
                    {isDe ? "8,0-Zoll Super Actua Flex & 5,1 mm Slim." : "8.0-Inch Super Actua Flex & Record 5.1mm Slim."}
                  </span>
                </>
              )}
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-muted leading-relaxed text-balance">
              {selectedModel === "pixel11"
                ? (isDe
                  ? "Googles neuestes Smartphone mit 3nm Tensor G5 Silizium, 6,3-Zoll Actua OLED mit 2.700 Nits, 50 MP Quad PD Dual-Kamera und 7 Jahren garantierten Updates."
                  : "Google's latest smartphone featuring 3nm TSMC Tensor G5 silicon, 6.3-inch 2,700-nit Actua OLED, 50MP Quad PD camera system, and 7 years of full OS updates.")
                : (isDe
                  ? "Faszinierendes Falterlebnis: Riesenhaftes 8,0-Zoll Super Actua Flex Innendisplay, 6,3-Zoll Cover, Triple Pro Kamerasystem mit 5x Periskop-Tele und reibungsfreies Zahnradscharnier."
                  : "Unrivaled folding innovation: expansive 8.0-inch Super Actua Flex inner canvas, 6.3-inch cover screen, Triple Pro optics with 5x periscope telephoto, and fluid gear hinge.")}
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
              onClick={() => handleSelectModel("pixel11")}
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[38px] ${
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
              className={`rounded-full px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[38px] ${
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

      {/* Interactive Media & Design Showcase Gallery */}
      <section className="py-10 md:py-16" ref={stageRef}>
        <div className="container-page">
          {/* Header Controls & View Selector */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl text-foreground">
                  {selectedModel === "pixel11" ? "Google Pixel 11" : "Google Pixel 11 Pro Fold"}
                </h2>
                <span className="rounded-full bg-blue/15 px-2.5 py-0.5 text-[11px] font-semibold text-blue">
                  {selectedModel === "pixel11" ? "Tensor G5 3nm" : "Tensor G5 Pro Fold"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                {isDe
                  ? "Originale Farbvarianten, hochauflösende Galerie und 4K-Videopräsentation"
                  : "Authentic color finishes, high-resolution gallery, and 4K video showcase"}
              </p>
            </div>

            {/* View Selector Pills */}
            <div className={`flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-surface p-1 text-xs ${s.noScrollbar}`}>
              {/* Color Variants / Design */}
              <button
                type="button"
                onClick={() => setViewMode("colors")}
                className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "colors"
                    ? "bg-blue text-white shadow-md shadow-blue/30"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>{isDe ? "Farben & Design" : "Colors & Design"}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("unfolded")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "unfolded" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {selectedModel === "proFold" ? (isDe ? "8,0\" Display entfaltet" : "8.0\" Canvas Unfolded") : (isDe ? "Frontalansicht" : "Front View")}
              </button>

              <button
                type="button"
                onClick={() => setViewMode("profile")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all whitespace-nowrap min-h-[36px] ${
                  viewMode === "profile" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {isDe ? "Profil & Scharnier" : "Profile & Hinge"}
              </button>

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

          {/* Main Visual Stage */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-strong/50 p-4 sm:p-8 flex flex-col items-center justify-center min-h-[520px] sm:min-h-[620px] md:min-h-[680px] lg:min-h-[740px]">
            {/* Dynamic Ambient Glow Sphere matching current finish color */}
            <div
              className={s.ambientBackdrop}
              style={{
                backgroundColor:
                  viewMode === "colors"
                    ? currentFinish.colorHex
                    : selectedModel === "proFold"
                    ? "#8a8a5c"
                    : "#4285f4",
              }}
              aria-hidden="true"
            />

            {/* Design Video Player */}
            {viewMode === "video" ? (
              <div className="relative z-10 w-full max-w-4xl aspect-[16/9] overflow-hidden rounded-2xl bg-black border border-border shadow-2xl flex flex-col justify-between">
                <video
                  ref={videoRef}
                  src={currentVideo.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-full p-1 border border-white/20 text-xs">
                  {VIDEO_TRACKS.map((track, idx) => (
                    <button
                      key={track.src}
                      type="button"
                      onClick={() => setActiveVideoIdx(idx)}
                      className={`px-3 py-1 rounded-full font-medium transition ${
                        idx === activeVideoIdx ? "bg-white text-black font-semibold" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {idx === 0 ? "Pixel 11" : idx === 1 ? "Magic AI" : "Pro Fold"}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative z-10 w-full flex flex-col items-center justify-center space-y-6">
                <div
                  className={`relative w-full max-w-3xl h-[360px] sm:h-[480px] md:h-[560px] lg:h-[620px] flex items-center justify-center ${s.stageImageAnimated}`}
                  key={`${selectedModel}-${viewMode}-${selectedFinishIndex}`}
                >
                  <Image
                    src={activeAsset.src}
                    alt={activeAsset.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)] transition-all duration-500"
                    priority
                  />
                </div>

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
                                  ? "scale-110 ring-2 ring-blue ring-offset-2 ring-offset-background shadow-lg shadow-blue/25"
                                  : "opacity-80 hover:opacity-100 hover:scale-105"
                              }`}
                              style={{ backgroundColor: finish.colorHex }}
                              title={finish.nameDe}
                              aria-label={`Farbe ${finish.nameDe}`}
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

            {/* Stage Quick Controls */}
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
                className="inline-flex items-center gap-1.5 rounded-full border border-blue/40 bg-surface px-4 py-2 text-xs font-semibold text-blue backdrop-blur-md transition hover:bg-blue hover:text-white shadow-md min-h-[38px]"
                aria-label={isDe ? "Theater-Vollbild öffnen" : "Open Theater Fullscreen Modal"}
              >
                <ExpandIcon className="size-3.5" />
                <span>{isDe ? "Vollbild-Theater" : "Fullscreen Theater"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Silicon & Engineering Hardware Architecture Section with Custom SVGs */}
      <section className="border-t border-border/80 bg-surface/20 py-16">
        <div className="container-page">
          <div className="mb-12 text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue">
              {isDe ? "Google Ingenieurskunst & Siliziumarchitektur" : "Google Engineering & Silicon Architecture"}
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl text-foreground font-sans">
              {isDe ? "Die 4 Schlüssel-Innovationen der Pixel 11 Serie" : "The 4 Core Innovations of the Pixel 11 Series"}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {isDe
                ? "Detaillierte Einblicke in Google Tensor G5, optische Periskop-Telezoomtechnik, reibungsloses Zahnradscharnier und Super Actua OLED."
                : "Deep architectural insights into Google Tensor G5, periscope telephoto optics, fluid gear hinge mechanics, and Super Actua OLED."}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Architecture Card 1: Google Tensor G5 */}
            <div className={`rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-blue/50 ${s.glassCard}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue/10 border border-blue/20">
                    <GoogleTensorCpuSvg className="size-14" />
                  </div>
                  <span className="text-[11px] font-bold text-blue border border-blue/30 bg-blue/10 px-2.5 py-1 rounded-full">
                    3nm TSMC N3P
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Google Tensor G5
                  </h3>
                  <p className="text-xs font-medium text-blue">
                    Custom TPU · Titan M3 Enclave
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Erstmals von TSMC im modernen 3nm-Verfahren gefertigt. Treibt Googles On-Device Gemini Nano Modelle an, verbessert die Akkulaufzeit und ermöglicht Echtzeit-KI ohne Cloud-Latenz."
                    : "Fabricated by TSMC on a breakthrough 3nm node. Powers on-device Gemini Nano multimodal intelligence, boosting battery endurance and zero-latency local processing."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span>{isDe ? "KI-Engine" : "AI Engine"}</span>
                <span className="font-semibold text-foreground">Gemini Live On-Device</span>
              </div>
            </div>

            {/* Architecture Card 2: Pro Pixel Camera & Periscope Telephoto */}
            <div className={`rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-gold/50 ${s.glassCard}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-gold/10 border border-gold/20">
                    <PixelPeriscopeCameraSvg className="size-14" />
                  </div>
                  <span className="text-[11px] font-bold text-gold border border-gold/30 bg-gold/10 px-2.5 py-1 rounded-full">
                    50 MP · 5X PERISCOPE
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    {isDe ? "Pro Pixel Kamerasystem" : "Pro Pixel Camera Suite"}
                  </h3>
                  <p className="text-xs font-medium text-gold">
                    Quad PD · 20x Super Res Zoom
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Der 50 MP Quad PD Sensor kombiniert mit 5x optischem Periskop-Telezoom fängt selbst bei minimalem Licht brillante Details ein. Gestützt von Googles HDR+ und Magic Editor."
                    : "The 50MP Quad PD sensor paired with a 5x folded periscope lens captures razor-sharp details in low light. Powered by Google HDR+ and next-gen Magic Editor."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span>{isDe ? "Optischer Zoom" : "Optical Zoom"}</span>
                <span className="font-semibold text-foreground">5x Periskop + OIS</span>
              </div>
            </div>

            {/* Architecture Card 3: Fluid Frictionless Gear Hinge */}
            <div className={`rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-green/50 ${s.glassCard}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-green/10 border border-green/20">
                    <PixelFrictionHingeSvg className="size-14" />
                  </div>
                  <span className="text-[11px] font-bold text-green border border-green/30 bg-green/10 px-2.5 py-1 rounded-full">
                    0.0 mm FLAT FOLD
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    {isDe ? "Reibungsloses Zahnradscharnier" : "Fluid Frictionless Gear Hinge"}
                  </h3>
                  <p className="text-xs font-medium text-green">
                    Hochfester Stahl · IPX8
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Präzisionsmechanik aus hochfestem Flugzeugstahl. Schließt völlig plan ohne Zwischenraum und hält das 8,0-Zoll-Display in jedem Winkel stabil im Tisch- oder Zeltmodus."
                    : "Precision multi-cam assembly crafted from aerospace high-strength steel. Folds completely flat with zero gap and supports stable positioning in tabletop or tent modes."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span>{isDe ? "Wasserfestigkeit" : "Water Resistance"}</span>
                <span className="font-semibold text-foreground">IPX8 Standard</span>
              </div>
            </div>

            {/* Architecture Card 4: Super Actua OLED Display */}
            <div className={`rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-blue/50 ${s.glassCard}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue/10 border border-blue/20">
                    <SuperActuaDisplaySvg className="size-14" />
                  </div>
                  <span className="text-[11px] font-bold text-blue border border-blue/30 bg-blue/10 px-2.5 py-1 rounded-full">
                    3.000 Nits · LTPO
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    Super Actua Flex OLED
                  </h3>
                  <p className="text-xs font-medium text-blue">
                    1-120 Hz variabel · UTG Glas
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  {isDe
                    ? "Kristallklares OLED-Display mit adaptiver Bildwiederholrate von 1 Hz bis 120 Hz und reflexionsarmer Beschichtung. Liefert selbst unter direkter Sommersonne perfekte Lesbarkeit."
                    : "Ultra-bright OLED canvas featuring dynamic refresh scaling from 1Hz to 120Hz and anti-reflective polarization. Ensures effortless readability even in direct summer sunlight."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                <span>{isDe ? "Spitzenhelligkeit" : "Peak Brightness"}</span>
                <span className="font-semibold text-foreground">3.000 Nits</span>
              </div>
            </div>
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

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={isDe ? "Vollbildansicht" : "Fullscreen Theater View"}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between z-20 pb-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">
                Google {selectedModel === "pixel11" ? "Pixel 11" : "Pixel 11 Pro Fold"}
              </span>
              <span className="text-xs text-white/60 hidden sm:inline">
                {isDe ? "Theater-Modus" : "Theater Mode"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition min-h-[44px] min-w-[44px]"
                title={isDe ? "Zoom umschalten (1x / 1.5x / 2x)" : "Toggle Zoom (1x / 1.5x / 2x)"}
                aria-label={isDe ? "Zoom vergrößern" : "Zoom in"}
              >
                {zoomLevel > 1 ? <ZoomOutIcon className="size-4" /> : <ZoomInIcon className="size-4" />}
              </button>

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

          {/* Center Stage in Modal */}
          <div className="relative flex-1 flex items-center justify-center overflow-auto w-full my-auto">
            {viewMode === "video" ? (
              <div className="relative w-full max-w-5xl aspect-[16/9] max-h-[80vh]">
                <video
                  src={currentVideo.src}
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

          {/* Bottom Bar Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 z-20">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs max-w-full">
              <button
                type="button"
                onClick={() => setViewMode("colors")}
                className={`px-3 py-1.5 rounded-lg font-medium transition min-h-[36px] ${
                  viewMode === "colors" ? "bg-blue text-white font-bold" : "text-white/70 hover:text-white bg-white/10"
                }`}
              >
                <span>{isDe ? "Farben" : "Colors"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("unfolded")}
                className={`px-3 py-1.5 rounded-lg font-medium transition min-h-[36px] ${
                  viewMode === "unfolded" ? "bg-white text-black" : "text-white/70 hover:text-white bg-white/10"
                }`}
              >
                {selectedModel === "proFold" ? (isDe ? "8,0\" Entfaltet" : "8.0\" Unfolded") : (isDe ? "Frontansicht" : "Front View")}
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
            </div>

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
                  title={finish.nameDe}
                  aria-label={finish.nameDe}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
