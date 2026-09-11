"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import s from "./PixelBanner.module.css";

export type PixelBannerProps = {
  id?: string;
  lang?: Locale;
  shopHref?: string;
  className?: string;
  variant?: "full" | "compact";
  headingLevel?: "h2" | "h3";
};

type PhoneColor = {
  name: string;
  labelDe: string;
  labelEn: string;
  hex: string;
  src: string;
};

const PIXEL11_COLORS: PhoneColor[] = [
  {
    name: "Frost",
    labelDe: "Pixel 11 · Frost",
    labelEn: "Pixel 11 · Frost",
    hex: "#e9e6df",
    src: "/images/google/pixel11/pixel-frost.webp",
  },
  {
    name: "Hibiscus",
    labelDe: "Pixel 11 · Hibiscus",
    labelEn: "Pixel 11 · Hibiscus",
    hex: "#e5a3b5",
    src: "/images/google/pixel11/pixel-hibiscus.webp",
  },
  {
    name: "Pistachio",
    labelDe: "Pixel 11 · Pistachio",
    labelEn: "Pixel 11 · Pistachio",
    hex: "#b9d9a8",
    src: "/images/google/pixel11/pixel-pistachio.webp",
  },
  {
    name: "Obsidian",
    labelDe: "Pixel 11 · Obsidian",
    labelEn: "Pixel 11 · Obsidian",
    hex: "#2b2c2e",
    src: "/images/google/pixel11/pixel-obsidian.webp",
  },
];

const FOLD_COLORS: PhoneColor[] = [
  {
    name: "Olive",
    labelDe: "Pro Fold · Olive",
    labelEn: "Pro Fold · Olive",
    hex: "#8a8a5c",
    src: "/images/google/pixel11/fold-olive.webp",
  },
  {
    name: "Obsidian",
    labelDe: "Pro Fold · Obsidian",
    labelEn: "Pro Fold · Obsidian",
    hex: "#2b2c2e",
    src: "/images/google/pixel11/fold-obsidian.webp",
  },
];

const VIDEOS = [
  { src: "/images/google/pixel11/pixel-hero.mp4", nameDe: "Pixel 11", nameEn: "Pixel 11" },
  { src: "/images/google/pixel11/pixel-magic.mp4", nameDe: "Magic Capture", nameEn: "Magic Capture" },
  { src: "/images/google/pixel11/fold-video.mp4", nameDe: "Pro Fold", nameEn: "Pro Fold" },
];

export default function PixelBanner({
  id,
  lang = "de",
  shopHref,
  className = "",
  variant = "full",
  headingLevel: Heading = "h2",
}: PixelBannerProps) {
  const isDe = lang === "de";
  const uniqueId = useId();
  const bannerId = id ?? uniqueId;
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const foldVideoRef = useRef<HTMLVideoElement>(null);

  const targetHref = shopHref || `/${lang}/pixel-11`;

  // Color Indexes
  const [phoneIndex, setPhoneIndex] = useState(0);
  const [foldIndex, setFoldIndex] = useState(0);

  // Video State
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Animation & Visibility
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  const currentPhone = PIXEL11_COLORS[phoneIndex];
  const currentFold = FOLD_COLORS[foldIndex];
  const currentVideo = VIDEOS[activeVideoIdx];

  // Intersection observer for video playback
  useEffect(() => {
    if (!rootRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync background video play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    if (isInView && !lightboxOpen && !reducedMotion) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isInView, lightboxOpen, reducedMotion, activeVideoIdx]);

  // Auto-cycle colors when not hovered
  useEffect(() => {
    if (isHovered || reducedMotion || !isInView) return;
    const interval = setInterval(() => {
      setPhoneIndex((prev) => (prev + 1) % PIXEL11_COLORS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isHovered, reducedMotion, isInView]);

  useEffect(() => {
    if (isHovered || reducedMotion || !isInView) return;
    const interval = setInterval(() => {
      setFoldIndex((prev) => (prev + 1) % FOLD_COLORS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isHovered, reducedMotion, isInView]);

  // Handle video toggle
  const handleToggleVideo = () => {
    setActiveVideoIdx((prev) => (prev + 1) % VIDEOS.length);
  };

  // Open / close fold video modal
  const openFoldVideo = () => {
    setLightboxOpen(true);
    setTimeout(() => {
      foldVideoRef.current?.play().catch(() => {});
    }, 50);
  };

  const closeFoldVideo = () => {
    foldVideoRef.current?.pause();
    setLightboxOpen(false);
  };

  return (
    <section
      ref={rootRef}
      id={bannerId}
      className={`${s.hero} ${variant === "compact" ? s.compact : ""} ${className}`}
      lang={lang}
      aria-labelledby={`${bannerId}-heading`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient Aurora Gradient */}
      <div className={s.ambient} aria-hidden="true" />

      {/* Floating Dust Particles in Google Colors */}
      <div className={s.dust} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>

      {/* Sunk Background Video with Feather Mask */}
      <div className={s.bgVideo} aria-hidden="true">
        <video
          ref={videoRef}
          src={currentVideo.src}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        />
      </div>

      {/* Curved Graphic Ring */}
      <div className={s.ring} aria-hidden="true" />

      {/* Banner Content Grid */}
      <div className={s.inner}>
        {/* Left Column: Copy & CTAs */}
        <div className={s.copy}>
          <div className={s.brand}>
            <span className={s.google}>Google</span>
            <span className={s.dots} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>

          <Heading id={`${bannerId}-heading`} className={s.title}>
            Pixel <span className={s.blue}>11.</span>
          </Heading>

          <p className={s.tagline}>
            {isDe ? "Dein Alltag. Neu gedacht." : "Everyday magic. Reimagined."}
          </p>

          <p className={s.lineup}>
            <span>Pixel 11</span> · <span>11 Pro</span> · <span>11 Pro XL</span> · <span>11 Pro Fold</span>
          </p>

          <div className={s.ctaRow}>
            <Link href={targetHref} className={s.cta}>
              <span>{isDe ? "Pixel entdecken" : "Explore Pixel"}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </Link>
            <span className={s.store}>APFEL PARK</span>
          </div>
        </div>

        {/* Center Column: 2 Interactive Phone Cards */}
        <div className={s.stage}>
          {/* Card 1: Pixel 11 (4 Finishes) */}
          <div className={s.phoneWrap} role="group" aria-label="Pixel 11 Farben">
            {PIXEL11_COLORS.map((item, idx) => (
              <div
                key={item.name}
                className={`${s.phoneSlide} ${idx === phoneIndex ? s.active : ""}`}
                aria-hidden={idx !== phoneIndex}
              >
                <div className={s.zoom}>
                  <Image
                    src={item.src}
                    alt={`Google Pixel 11 in ${item.name}`}
                    width={600}
                    height={480}
                    priority={idx === 0}
                    className="object-contain"
                  />
                </div>
              </div>
            ))}

            <div className={s.colorMeta}>
              <div className={s.colorLabel}>
                <span>{isDe ? currentPhone.labelDe : currentPhone.labelEn}</span>
              </div>

              <div className={s.colorDots} role="group" aria-label="Pixel 11 Farbwahl">
                {PIXEL11_COLORS.map((item, idx) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setPhoneIndex(idx)}
                    className={`${s.colorDot} ${idx === phoneIndex ? s.active : ""}`}
                    style={{ backgroundColor: item.hex }}
                    title={item.name}
                    aria-label={`Farbe ${item.name}`}
                    aria-pressed={idx === phoneIndex}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Pixel 11 Pro Fold (2 Finishes + Video Trigger) */}
          <div className={`${s.phoneWrap} ${s.foldWrap}`} role="group" aria-label="Pixel 11 Pro Fold Farben">
            {FOLD_COLORS.map((item, idx) => (
              <div
                key={item.name}
                className={`${s.foldSlide} ${idx === foldIndex ? s.active : ""}`}
                aria-hidden={idx !== foldIndex}
              >
                <div className={s.zoom}>
                  <Image
                    src={item.src}
                    alt={`Google Pixel 11 Pro Fold in ${item.name}`}
                    width={600}
                    height={480}
                    priority={idx === 0}
                    className="object-contain"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={openFoldVideo}
              className={s.foldPlay}
              aria-label={isDe ? "Fold Video abspielen" : "Play Fold Video"}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 2l9 6-9 6z" />
              </svg>
              <span>Video</span>
            </button>

            <div className={s.colorMeta}>
              <div className={s.colorLabel}>
                <span>{isDe ? currentFold.labelDe : currentFold.labelEn}</span>
              </div>

              <div className={s.colorDots} role="group" aria-label="Pixel 11 Pro Fold Farbwahl">
                {FOLD_COLORS.map((item, idx) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setFoldIndex(idx)}
                    className={`${s.colorDot} ${idx === foldIndex ? s.active : ""}`}
                    style={{ backgroundColor: item.hex }}
                    title={item.name}
                    aria-label={`Farbe ${item.name}`}
                    aria-pressed={idx === foldIndex}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Video Controls in Bottom Right */}
      <div className={s.vidUi}>
        <span>
          <span className={s.liveDot} />
          <span>{isDe ? currentVideo.nameDe : currentVideo.nameEn}</span>
        </span>
        <button
          type="button"
          onClick={handleToggleVideo}
          className={s.vidToggle}
        >
          {isDe ? "Video wechseln" : "Switch Video"}
        </button>
      </div>

      <span className={s.notice}>Originalbilder &amp; Videos · store.google.com</span>

      {/* Fold Video Lightbox Modal */}
      {lightboxOpen && (
        <div
          className={s.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Pixel 11 Pro Fold Video"
        >
          <div className={s.lbBackdrop} onClick={closeFoldVideo} />
          <div className={s.lbBox}>
            <video
              ref={foldVideoRef}
              src="/images/google/pixel11/fold-video.mp4"
              controls
              playsInline
              preload="metadata"
            />
            <button
              type="button"
              onClick={closeFoldVideo}
              className={s.lbClose}
              aria-label={isDe ? "Video schließen" : "Close video"}
            >
              ✕
            </button>
            <div className={s.lbCap}>
              {isDe ? "Pixel 11 Pro Fold · Originalvideo" : "Pixel 11 Pro Fold · Official Video"}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
