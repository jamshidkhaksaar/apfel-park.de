"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { APPLE_MEDIA } from "./apple-media";
import s from "./IPhoneBanner.module.css";

type Model = "pro" | "duo";
type Media = { [K in keyof typeof APPLE_MEDIA]: string };

export type IPhoneBannerProps = {
  id?: string;
  shopHref?: string;
  className?: string;
  headingLevel?: "h1" | "h2";
  ctaLabel?: string;
  primaryTitle?: string;
  secondaryTitle?: string;
  animated?: boolean;
  media?: Partial<Media>;
};

const APPLE_PATH = "M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282";

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!image.current?.naturalWidth) setFailed(true);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [src]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={image}
        className={s.photo}
        src={src}
        alt={alt}
        decoding="async"
        loading="eager"
        onError={() => setFailed(true)}
        onLoad={() => setFailed(false)}
        style={failed ? { visibility: "hidden" } : undefined}
      />
      {failed ? <span className={s.error}>Bild wird geladen...</span> : null}
    </>
  );
}

export default function IPhoneBanner({
  id,
  shopHref = "/de/store",
  className = "",
  headingLevel: Heading = "h2",
  ctaLabel = "Jetzt entdecken",
  primaryTitle = "iPhone 18",
  secondaryTitle = "iPhone Duo",
  animated = true,
  media: overrides,
}: IPhoneBannerProps) {
  const uniqueId = useId();
  const headingId = `${id ?? uniqueId}-title`;
  const media: Media = { ...APPLE_MEDIA, ...overrides };
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  const [hovered, setHovered] = useState<Model | null>(null);
  const [pinned, setPinned] = useState<Model | null>(null);
  const [proView, setProView] = useState<0 | 1>(0);
  const [duoView, setDuoView] = useState<0 | 1>(1);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [film, setFilm] = useState(true);

  // Fullscreen Theater Modal State
  type TheaterTab = "pro-0" | "pro-1" | "duo-0" | "duo-1" | "duo-video";
  const [theaterOpen, setTheaterOpen] = useState(false);
  const [theaterTab, setTheaterTab] = useState<TheaterTab>("duo-video");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock body scroll when theater is open
  useEffect(() => {
    if (!theaterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [theaterOpen]);

  // Track native fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen API restrictions
    }
  };

  const active = hovered ?? pinned;
  const stopped = paused || !animated;
  const proSrc = proView ? media.proFrontBack : media.proLineup;
  const duoSrc = duoView ? media.duoWhite : media.duoNight;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting))
        : null;
    if (root.current) observer?.observe(root.current);
    return () => {
      query.removeEventListener("change", update);
      observer?.disconnect();
    };
  }, []);

  // Robust video playback management
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.muted = true;
    element.defaultMuted = true;
    element.playsInline = true;

    const playVideo = () => {
      if (film && !stopped && !reduced && !offscreen && !document.hidden) {
        element.muted = true;
        const playPromise = element.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silently handle autoplay restrictions
          });
        }
      } else {
        element.pause();
      }
    };

    playVideo();
    document.addEventListener("visibilitychange", playVideo);
    return () => {
      element.pause();
      document.removeEventListener("visibilitychange", playVideo);
    };
  }, [film, stopped, reduced, offscreen, media.duoVideo]);

  // Handle theater keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTheaterOpen(false);
        setPinned(null);
        setHovered(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function togglePin(model: Model) {
    setPinned((old) => (old === model ? null : model));
  }

  function setDuo(view: 0 | 1) {
    setDuoView(view);
    setFilm(false);
  }

  function activateFilm() {
    setFilm(true);
    if (video.current) {
      video.current.muted = true;
      video.current.play().catch(() => {});
    }
  }

  function enter(model: Model, pointerType: string) {
    if (pointerType !== "touch" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setHovered(model);
    }
  }

  function openProTheater() {
    setTheaterTab(proView === 0 ? "pro-0" : "pro-1");
    setTheaterOpen(true);
  }

  function openDuoTheater() {
    if (film) {
      setTheaterTab("duo-video");
    } else {
      setTheaterTab(duoView === 0 ? "duo-0" : "duo-1");
    }
    setTheaterOpen(true);
  }

  return (
    <>
      <section
        ref={root}
        id={id}
        lang="de"
        className={`${s.hero} ${className}`}
        data-paused={String(stopped)}
        data-reduced={String(reduced)}
        data-offscreen={String(offscreen)}
        aria-labelledby={headingId}
      >
        <div className={s.gold} aria-hidden="true" />
        <div className={s.ring} aria-hidden="true" />
        <div className={s.inner}>
          <div className={s.copy}>
            <div className={s.brand}>
              <svg className={s.apple} viewBox="-1 -1 18 18" aria-hidden="true" focusable="false">
                <path fill="currentColor" d={APPLE_PATH} />
              </svg>
              <span>APFEL PARK</span>
            </div>
            <Heading className={s.heading} id={headingId}>
              <span>{primaryTitle}</span>
              <span>{secondaryTitle}</span>
            </Heading>
            <p className={s.tagline}>Eine neue Ära. In deiner Hand.</p>
            <Link className={s.cta} href={shopHref}>
              <span>{ctaLabel}</span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 12h15m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <div className={s.products} aria-label="iPhone Modelle">
            {/* Slot 1: iPhone 18 Pro Family */}
            <figure
              className={s.model}
              data-active={String(active === "pro")}
              onPointerEnter={(e) => enter("pro", e.pointerType)}
              onPointerLeave={() => setHovered(null)}
            >
              <button
                className={s.zoom}
                type="button"
                aria-label="iPhone 18 Pro Vollbildansicht öffnen"
                onClick={openProTheater}
              >
                {proSrc ? (
                  <>
                    <div className={s.fullscreenBadge}>
                      <span>⤢</span>
                      <span>Vollbild</span>
                    </div>
                    <span className={s.art}>
                      <ProductImage
                        key={proSrc}
                        src={proSrc}
                        alt={
                          proView
                            ? "iPhone 18 Pro und Pro Max in Burgunder, Vorder- und Rückseite"
                            : "iPhone 18 Pro – Farbübersicht"
                        }
                      />
                    </span>
                  </>
                ) : (
                  <div className={s.placeholderSlot} onClick={() => togglePin("pro")}>
                    <div className={s.placeholderIcon}>📱</div>
                    <div className={s.placeholderLabel}>iPhone 18 Pro / Pro Max</div>
                    <div className={s.placeholderHint}>Bereit für Bild-Upload</div>
                  </div>
                )}
              </button>
              <figcaption className={s.name}>iPhone 18 Pro / Pro Max</figcaption>
              <div className={s.variants} role="group" aria-label="Pro Ansicht">
                <button
                  className={s.variant}
                  type="button"
                  aria-pressed={proView === 0}
                  onClick={() => setProView(0)}
                >
                  Farbübersicht
                </button>
                <button
                  className={s.variant}
                  type="button"
                  aria-pressed={proView === 1}
                  onClick={() => setProView(1)}
                >
                  Vorn &amp; hinten
                </button>
              </div>
            </figure>

            {/* Slot 2: iPhone Duo Foldable with 4K Video */}
            <figure
              className={s.model}
              data-active={String(active === "duo")}
              data-video-ready={String(film)}
              onPointerEnter={(e) => enter("duo", e.pointerType)}
              onPointerLeave={() => setHovered(null)}
            >
              <button
                className={s.zoom}
                type="button"
                aria-label="iPhone Duo Vollbildansicht öffnen"
                onClick={openDuoTheater}
              >
                <div className={s.fullscreenBadge}>
                  <span>⤢</span>
                  <span>Vollbild</span>
                </div>
                <span className={s.art}>
                  {duoSrc && !film ? (
                    <ProductImage key={duoSrc} src={duoSrc} alt="iPhone Duo – Designansicht" />
                  ) : null}
                  <video
                    ref={video}
                    className={s.video}
                    src={media.duoVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                    style={{ visibility: film ? "visible" : "hidden" }}
                  />
                </span>
              </button>
              <figcaption className={s.name}>iPhone Duo (Foldable)</figcaption>
              <div className={s.variants} role="group" aria-label="Duo Ansicht">
                <button
                  className={s.variant}
                  type="button"
                  aria-pressed={film}
                  onClick={activateFilm}
                >
                  🎬 4K Film
                </button>
                <button
                  className={s.variant}
                  type="button"
                  aria-pressed={!film && duoView === 0}
                  onClick={() => setDuo(0)}
                >
                  Dunkel
                </button>
                <button
                  className={s.variant}
                  type="button"
                  aria-pressed={!film && duoView === 1}
                  onClick={() => setDuo(1)}
                >
                  Hell
                </button>
              </div>
            </figure>
          </div>
        </div>

        <p className={s.hint}>Klicke auf ein Modell für die hochauflösende Vollbildansicht</p>
        <button
          className={s.pause}
          type="button"
          aria-label={stopped ? "Animation fortsetzen" : "Animation pausieren"}
          aria-pressed={stopped}
          onClick={() => setPaused((old) => !old)}
          disabled={!animated}
        >
          <svg className={s.pauseIcon} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4 3h3v10H4zm5 0h3v10H9z" />
          </svg>
          <svg className={s.playIcon} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="m5 3 8 5-8 5z" />
          </svg>
        </button>
      </section>

      {/* Fullscreen Theater Lightbox Modal via React Portal to Document Body */}
      {typeof document !== "undefined" && theaterOpen && createPortal(
        <div
          className={s.theaterOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Vollbild-Vorschau"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTheaterOpen(false);
          }}
        >
          <header className={s.theaterHeader}>
            <div className={s.theaterTitle}>
              <svg className={s.apple} viewBox="-1 -1 18 18" aria-hidden="true">
                <path fill="#e7c779" d={APPLE_PATH} />
              </svg>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#fff" }}>
                  {theaterTab.startsWith("pro")
                    ? "Apple iPhone 18 Pro & Pro Max"
                    : "Apple iPhone Duo (Foldable)"}
                </h3>
                <span style={{ fontSize: "12px", color: "#e7c779" }}>
                  {theaterTab === "pro-0" && "Titanium Lineup – Farbübersicht"}
                  {theaterTab === "pro-1" && "Vorder- und Rückseite mit variabler Optik"}
                  {theaterTab === "duo-0" && "Titan Dunkel – 7.6\" Foldable Display"}
                  {theaterTab === "duo-1" && "Titan Hell – Ultradünnes Scharnier"}
                  {theaterTab === "duo-video" && "Offizieller Apple Reveal Film (4K)"}
                </span>
              </div>
            </div>

            <div className={s.theaterActions}>
              <button
                className={s.theaterFullscreenBtn}
                onClick={toggleNativeFullscreen}
                aria-label={isFullscreen ? "Vollbild beenden" : "Vollbildschirm aktivieren"}
                title={isFullscreen ? "Vollbild beenden" : "Vollbildschirm aktivieren"}
                type="button"
              >
                {isFullscreen ? "🗗 Beenden" : "⛶ Vollbild"}
              </button>
              <button
                className={s.theaterClose}
                onClick={() => setTheaterOpen(false)}
                aria-label="Vollbild schließen"
                type="button"
              >
                ✕
              </button>
            </div>
          </header>

          <main className={s.theaterBody}>
            <div className={s.theaterMediaWrapper}>
              {theaterTab === "pro-0" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.proLineup}
                  alt="iPhone 18 Pro Farbübersicht"
                  className={s.theaterImage}
                />
              )}
              {theaterTab === "pro-1" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.proFrontBack}
                  alt="iPhone 18 Pro Vorder- und Rückseite"
                  className={s.theaterImage}
                />
              )}
              {theaterTab === "duo-0" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.duoNight}
                  alt="iPhone Duo Dunkel"
                  className={s.theaterImage}
                />
              )}
              {theaterTab === "duo-1" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.duoWhite}
                  alt="iPhone Duo Hell"
                  className={s.theaterImage}
                />
              )}
              {theaterTab === "duo-video" && (
                <video
                  className={s.theaterVideo}
                  src={media.duoVideo}
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </div>
          </main>

          <footer className={s.theaterFooter}>
            <div className={s.theaterTabs}>
              <button
                className={s.theaterTab}
                type="button"
                aria-pressed={theaterTab === "pro-0"}
                onClick={() => setTheaterTab("pro-0")}
              >
                18 Pro: Farbübersicht
              </button>
              <button
                className={s.theaterTab}
                type="button"
                aria-pressed={theaterTab === "pro-1"}
                onClick={() => setTheaterTab("pro-1")}
              >
                18 Pro: Vorn &amp; hinten
              </button>
              <button
                className={s.theaterTab}
                type="button"
                aria-pressed={theaterTab === "duo-0"}
                onClick={() => setTheaterTab("duo-0")}
              >
                Duo: Dunkel
              </button>
              <button
                className={s.theaterTab}
                type="button"
                aria-pressed={theaterTab === "duo-1"}
                onClick={() => setTheaterTab("duo-1")}
              >
                Duo: Hell
              </button>
              <button
                className={s.theaterTab}
                type="button"
                aria-pressed={theaterTab === "duo-video"}
                onClick={() => setTheaterTab("duo-video")}
              >
                🎬 Duo: 4K Film
              </button>
            </div>

            <Link
              href={shopHref}
              className={s.cta}
              onClick={() => setTheaterOpen(false)}
            >
              <span>{ctaLabel}</span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 12h15m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </footer>
        </div>,
        document.body
      )}
    </>
  );
}

