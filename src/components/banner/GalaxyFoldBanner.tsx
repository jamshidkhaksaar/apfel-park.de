"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { siteInfo } from "@/lib/site";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import s from "./GalaxyFoldBanner.module.css";

export type GalaxyFoldBannerProps = {
  id?: string;
  lang?: Locale;
  shopHref?: string;
  className?: string;
  variant?: "full" | "compact";
  headingLevel?: "h2" | "h3";
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

export default function GalaxyFoldBanner({
  id,
  lang = "de",
  shopHref,
  className = "",
  variant = "full",
  headingLevel: Heading = "h2",
}: GalaxyFoldBannerProps) {
  const isDe = lang === "de";
  const uniqueId = useId();
  const bannerId = id ?? uniqueId;
  const rootRef = useRef<HTMLElement>(null);

  const defaultShopHref = `/${lang}/galaxy-z-fold-8`;
  const targetHref = shopHref || defaultShopHref;

  // Carousel Active Indexes
  const [fold8Index, setFold8Index] = useState(0);
  const [ultraIndex, setUltraIndex] = useState(0);

  // Interaction & Visibility State
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  // Performance: observe intersection
  useEffect(() => {
    if (!rootRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-Cycle Fold8 (3.2s interval)
  useEffect(() => {
    if (isPaused || !isInView || reducedMotion) return;
    const timer = setInterval(() => {
      setFold8Index((prev) => (prev + 1) % FOLD8_FINISHES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isPaused, isInView, reducedMotion]);

  // Auto-Cycle Ultra (3.2s interval, offset by 1.6s)
  useEffect(() => {
    if (isPaused || !isInView || reducedMotion) return;
    const timeout = setTimeout(() => {
      const timer = setInterval(() => {
        setUltraIndex((prev) => (prev + 1) % ULTRA_FINISHES.length);
      }, 3200);
      return () => clearInterval(timer);
    }, 1600);
    return () => clearTimeout(timeout);
  }, [isPaused, isInView, reducedMotion]);

  // WhatsApp Inquiry URL
  const waMessage = encodeURIComponent(
    isDe
      ? `Guten Tag Apfel Park Team, ich interessiere mich für das Samsung Galaxy Z Fold8 und Z Fold8 Ultra. Bitte senden Sie mir ein Angebot und Informationen zur Verfügbarkeit.`
      : `Hello Apfel Park Team, I am inquiring about the Samsung Galaxy Z Fold8 and Z Fold8 Ultra. Please provide pricing and availability details.`
  );
  const waUrl = `https://wa.me/${siteInfo.whatsapp}?text=${waMessage}`;

  const currentFold8 = FOLD8_FINISHES[fold8Index];
  const currentUltra = ULTRA_FINISHES[ultraIndex];

  return (
    <section
      ref={rootRef}
      id={bannerId}
      className={`${s.banner} ${variant === "compact" ? s.compact : ""} ${className}`}
      aria-label={isDe ? "Samsung Galaxy Z Fold8 & Z Fold8 Ultra Flaggschiff Banner" : "Samsung Galaxy Z Fold8 & Z Fold8 Ultra Flagship Banner"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className={s.topAccent} />
      <div className={s.glow1} />
      <div className={s.glow2} />
      <div className={s.gridOverlay} />

      <div className={s.layout}>
        {/* Left Column: Editorial Information */}
        <div className={s.content}>
          <div className={s.brand}>
            <div className={s.brandIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <span className={s.brandName}>Samsung Galaxy</span>
          </div>

          <Heading className={s.heading}>
            {isDe ? (
              <>
                Die Zukunft <span className={s.goldWord}>faltet</span> sich.
              </>
            ) : (
              <>
                The Future <span className={s.goldWord}>Unfolds</span>.
              </>
            )}
          </Heading>

          <p className={s.tagline}>
            {isDe
              ? "Galaxy Z Fold8 und Z Fold8 Ultra — High-End Produktivität mit 200 MP Optik, Snapdragon 8 Gen 5 und Armor Aluminum Gehäuse in 8 edlen Finishes."
              : "Galaxy Z Fold8 & Z Fold8 Ultra — flagship foldables featuring 200MP optics, Snapdragon 8 Gen 5 silicon and Armor Aluminum build in 8 refined finishes."}
          </p>

          <div className={s.specRow} aria-label={isDe ? "Technische Highlights" : "Key Specifications"}>
            <span className={s.specBadge}>
              <span className={s.specBadgeDot} />
              {isDe ? "7,6\" Dynamic AMOLED 2X" : "7.6\" Dynamic AMOLED 2X"}
            </span>
            <span className={s.specBadge}>
              <span className={s.specBadgeDot} />
              Snapdragon 8 Gen 5
            </span>
            <span className={s.specBadge}>
              <span className={s.specBadgeDot} />
              {isDe ? "Armor Aluminum" : "Armor Aluminum"}
            </span>
          </div>

          <div className={s.ctaRow}>
            <Link href={targetHref} className={s.ctaPrimary}>
              <span>{isDe ? "Modelle entdecken" : "Explore models"}</span>
              <svg className={s.ctaArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.ctaSecondary}
              aria-label={isDe ? "Angebot für Galaxy Z Fold per WhatsApp anfragen" : "Request Galaxy Z Fold quote via WhatsApp"}
            >
              <span>{isDe ? "Angebot anfragen" : "Request quote"}</span>
              <span className="text-gold" aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Right Column: Dual Interactive Carousel Stage */}
        <div className={s.stage}>
          <div className={s.orbit1} aria-hidden="true" />
          <div className={s.orbit2} aria-hidden="true" />

          <div className={s.dualCarousel}>
            {/* Slot 1: Galaxy Z Fold8 */}
            <div className={`${s.carousel} ${s.carouselFold8}`}>
              <div className={s.phoneGlow} aria-hidden="true" />

              <div className={s.phoneContainer}>
                {FOLD8_FINISHES.map((finish, idx) => (
                  <div
                    key={finish.id}
                    className={`${s.slide} ${idx === fold8Index ? s.active : s.exit}`}
                    aria-hidden={idx !== fold8Index}
                  >
                    <Image
                      src={finish.src}
                      alt={`Samsung Galaxy Z Fold8 — ${isDe ? finish.nameDe : finish.nameEn}`}
                      width={480}
                      height={640}
                      className={s.slideImage}
                      priority={idx === 0}
                    />
                  </div>
                ))}
              </div>

              <div className={s.modelHeader}>
                <div className={s.modelName}>Z Fold8</div>
                <div className={s.colorLabel}>{isDe ? currentFold8.nameDe : currentFold8.nameEn}</div>
              </div>

              <div
                className={s.colorDots}
                role="group"
                aria-label={isDe ? "Galaxy Z Fold8 Farbvarianten" : "Galaxy Z Fold8 color finishes"}
              >
                {FOLD8_FINISHES.map((finish, idx) => (
                  <button
                    key={finish.id}
                    type="button"
                    className={`${s.colorDot} ${idx === fold8Index ? s.active : ""}`}
                    style={{ backgroundColor: finish.colorHex }}
                    title={isDe ? finish.nameDe : finish.nameEn}
                    aria-label={`Galaxy Z Fold8 ${isDe ? finish.nameDe : finish.nameEn}`}
                    aria-pressed={idx === fold8Index}
                    onClick={() => setFold8Index(idx)}
                  />
                ))}
              </div>
            </div>

            {/* Slot 2: Galaxy Z Fold8 Ultra */}
            <div className={`${s.carousel} ${s.carouselUltra}`}>
              <div className={s.phoneGlow} aria-hidden="true" />

              <div className={s.phoneContainer}>
                {ULTRA_FINISHES.map((finish, idx) => (
                  <div
                    key={finish.id}
                    className={`${s.slide} ${idx === ultraIndex ? s.active : s.exit}`}
                    aria-hidden={idx !== ultraIndex}
                  >
                    <Image
                      src={finish.src}
                      alt={`Samsung Galaxy Z Fold8 Ultra — ${isDe ? finish.nameDe : finish.nameEn}`}
                      width={520}
                      height={680}
                      className={s.slideImage}
                      priority={idx === 0}
                    />
                  </div>
                ))}
              </div>

              <div className={s.modelHeader}>
                <div className={s.modelName}>Z Fold8 Ultra</div>
                <div className={s.colorLabel}>{isDe ? currentUltra.nameDe : currentUltra.nameEn}</div>
              </div>

              <div
                className={s.colorDots}
                role="group"
                aria-label={isDe ? "Galaxy Z Fold8 Ultra Farbvarianten" : "Galaxy Z Fold8 Ultra color finishes"}
              >
                {ULTRA_FINISHES.map((finish, idx) => (
                  <button
                    key={finish.id}
                    type="button"
                    className={`${s.colorDot} ${idx === ultraIndex ? s.active : ""}`}
                    style={{ backgroundColor: finish.colorHex }}
                    title={isDe ? finish.nameDe : finish.nameEn}
                    aria-label={`Galaxy Z Fold8 Ultra ${isDe ? finish.nameDe : finish.nameEn}`}
                    aria-pressed={idx === ultraIndex}
                    onClick={() => setUltraIndex(idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
