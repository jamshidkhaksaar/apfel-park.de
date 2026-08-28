"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { shouldBypassImageOptimization } from "@/lib/image";

type Props = {
  title: string;
  images: string[];
};

export default function ProductGallery({ title, images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const activeImage = images[activeIndex] ?? images[0] ?? "";

  const switchTo = useCallback(
    (index: number) => {
      const bounded = (index + images.length) % images.length;
      if (bounded === activeIndex) return;
      setFading(true);
      setTimeout(() => {
        setActiveIndex(bounded);
        setFading(false);
      }, 180);
    },
    [activeIndex, images.length],
  );

  // Arrow keys page through the gallery while the lightbox is open; Escape closes.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowRight") switchTo(activeIndex + 1);
      if (event.key === "ArrowLeft") switchTo(activeIndex - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, activeIndex, switchTo]);

  if (!activeImage) {
    return null;
  }

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null || images.length < 2) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    switchTo(activeIndex + (delta < 0 ? 1 : -1));
  };

  const arrowClass =
    "absolute top-1/2 z-10 -translate-y-1/2 rounded-full border border-border/60 bg-background/80 p-2 text-foreground backdrop-blur transition hover:border-gold/40 hover:text-gold";

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-white p-2 sm:p-4">
        <div
          className="group relative aspect-square overflow-hidden rounded-2xl bg-[#f5f5f5] sm:rounded-[28px]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-zoom-in"
            aria-label={title}
            onClick={() => setLightboxOpen(true)}
          />
          <Image
            key={activeImage}
            src={activeImage}
            alt={title}
            fill
            priority
            className={`object-contain p-4 transition-opacity duration-200 sm:p-6 ${fading ? "opacity-0" : "opacity-100"}`}
            sizes="(max-width: 1280px) 100vw, 760px"
            unoptimized={shouldBypassImageOptimization(activeImage)}
          />
          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className={`${arrowClass} left-3 z-20 opacity-0 transition group-hover:opacity-100`}
                onClick={() => switchTo(activeIndex - 1)}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button
                type="button"
                aria-label="Next image"
                className={`${arrowClass} right-3 z-20 opacity-0 transition group-hover:opacity-100`}
                onClick={() => switchTo(activeIndex + 1)}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
              </button>
              <span className="absolute bottom-3 right-4 z-10 rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-muted backdrop-blur">
                {activeIndex + 1} / {images.length}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => switchTo(index)}
              className={`relative w-[4.5rem] shrink-0 overflow-hidden rounded-xl border bg-[#f5f5f5] transition-all duration-200 sm:w-24 sm:rounded-2xl ${
                activeIndex === index
                  ? "border-gold/60 ring-2 ring-gold/30 scale-[1.03]"
                  : "border-border/60 hover:border-gold/30 hover:scale-[1.02]"
              }`}
            >
              <div className="relative aspect-square">
                <Image
                  src={image}
                  alt={`${title} ${index + 1}`}
                  fill
                  className={`object-contain p-2 transition-opacity duration-200 ${activeIndex === index ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                  sizes="160px"
                  unoptimized={shouldBypassImageOptimization(image)}
                />
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative h-full max-h-[85vh] w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Image
              key={`lightbox-${activeImage}`}
              src={activeImage}
              alt={title}
              fill
              className={`object-contain transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
              sizes="100vw"
              unoptimized={shouldBypassImageOptimization(activeImage)}
            />
            {images.length > 1 ? (
              <>
                <button type="button" aria-label="Previous image" className={`${arrowClass} left-2`} onClick={() => switchTo(activeIndex - 1)}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button type="button" aria-label="Next image" className={`${arrowClass} right-2`} onClick={() => switchTo(activeIndex + 1)}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
                </button>
              </>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-5 top-5 rounded-full border border-border/60 bg-background/80 p-2.5 text-foreground backdrop-blur transition hover:border-gold/40 hover:text-gold"
            onClick={() => setLightboxOpen(false)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          {images.length > 1 ? (
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-background/70 px-3 py-1 text-sm text-muted backdrop-blur">
              {activeIndex + 1} / {images.length}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
