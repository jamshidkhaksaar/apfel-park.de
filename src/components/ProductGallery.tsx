"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { shouldBypassImageOptimization } from "@/lib/image";
import type { Locale } from "@/lib/i18n";

type Props = {
  title: string;
  images: string[];
  locale: Locale;
};

export default function ProductGallery({ title, images, locale }: Props) {
  const labels = locale === "de"
    ? { open: "Bildergalerie öffnen", previous: "Vorheriges Bild", next: "Nächstes Bild", close: "Schließen", image: "Bild", of: "von" }
    : { open: "Open image gallery", previous: "Previous image", next: "Next image", close: "Close", image: "Image", of: "of" };
  const imagePosition = (index: number) => `${labels.image} ${index + 1} ${labels.of} ${images.length}`;
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

  // Only opening/closing owns focus and scroll; image navigation never tears it down.
  useEffect(() => {
    if (!lightboxOpen) return;
    const dialog = lightboxRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && document.activeElement !== previousFocus) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [lightboxOpen]);

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      if (images.length > 1) switchTo(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

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
            ref={openButtonRef}
            type="button"
            className="absolute inset-0 z-10 cursor-zoom-in"
            aria-label={`${labels.open}: ${title}`}
            aria-haspopup="dialog"
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
                aria-label={labels.previous}
                className={`${arrowClass} left-3 z-20 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100`}
                onClick={() => switchTo(activeIndex - 1)}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button
                type="button"
                aria-label={labels.next}
                className={`${arrowClass} right-3 z-20 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100`}
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

      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{imagePosition(activeIndex)}</span>

      {images.length > 1 ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={imagePosition(index)}
              aria-pressed={activeIndex === index}
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
                  alt=""
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
        <dialog
          ref={lightboxRef}
          aria-label={title}
          className="fixed inset-0 m-0 flex h-dvh max-h-dvh w-screen max-w-none items-center justify-center overflow-hidden border-0 bg-black/90 p-4 backdrop-blur-sm backdrop:bg-transparent"
          onKeyDown={onDialogKeyDown}
          onCancel={(event) => {
            event.preventDefault();
            setLightboxOpen(false);
          }}
          onClose={() => setLightboxOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false);
          }}
        >
          <div
            className="relative h-full max-h-[85dvh] w-full max-w-4xl"
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
                <button type="button" aria-label={labels.previous} className={`${arrowClass} left-2`} onClick={() => switchTo(activeIndex - 1)}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button type="button" aria-label={labels.next} className={`${arrowClass} right-2`} onClick={() => switchTo(activeIndex + 1)}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
                </button>
              </>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={labels.close}
            className="absolute right-5 top-5 rounded-full border border-border/60 bg-background/80 p-2.5 text-foreground backdrop-blur transition hover:border-gold/40 hover:text-gold"
            onClick={() => setLightboxOpen(false)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{imagePosition(activeIndex)}</span>
          {images.length > 1 ? (
            <span aria-hidden="true" className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-background/70 px-3 py-1 text-sm text-muted backdrop-blur">
              {activeIndex + 1} / {images.length}
            </span>
          ) : null}
        </dialog>
      ) : null}
    </div>
  );
}
