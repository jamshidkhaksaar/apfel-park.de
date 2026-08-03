"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Locale } from "../lib/i18n";
import type { HeroMediaSettings } from "../lib/site-settings-server";
import { shouldBypassImageOptimization } from "@/lib/image";

export type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
};

export default function HeroSlider({
  lang,
  media,
  hero,
}: {
  lang: Locale;
  media?: HeroMediaSettings | null;
  hero?: HeroContent | null;
}) {
  const [videoReady, setVideoReady] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const fallbackImage = media?.posterUrl || media?.fallbackImageUrl || "/images/shop2.jpg";
  const useUnoptimizedImage = shouldBypassImageOptimization(fallbackImage);
  const configuredSlides = Array.isArray(media?.mobileImages)
    ? media.mobileImages.filter((value) => typeof value === "string" && value.trim().length > 0)
    : [];
  const mobileSlides = configuredSlides.length > 0 ? configuredSlides : [fallbackImage];
  const activeMobileIndex = mobileSlides.length > 0 ? mobileIndex % mobileSlides.length : 0;
  const hasVideo =
    Boolean(media?.enabled) &&
    media?.sourceType !== "image" &&
    Boolean(media?.videoUrl);

  useEffect(() => {
    if (mobileSlides.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setMobileIndex((current) => (current + 1) % mobileSlides.length);
    }, 3600);

    return () => window.clearInterval(interval);
  }, [mobileSlides.length]);

  return (
    <section className="relative min-h-[56vh] overflow-hidden md:min-h-[85vh]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 md:hidden">
          <Image
            key={`${mobileSlides[activeMobileIndex]}-${activeMobileIndex}`}
            src={mobileSlides[activeMobileIndex]}
            alt="Apfel Park Store in Hamburg"
            fill
            priority={activeMobileIndex === 0}
            sizes="100vw"
            unoptimized={shouldBypassImageOptimization(mobileSlides[activeMobileIndex])}
            className="object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 hidden md:block">
          <Image
            src={fallbackImage}
            alt={lang === "de" ? "Apfel Park Store in Hamburg" : "Apfel Park Store in Hamburg"}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            unoptimized={useUnoptimizedImage}
          />
        </div>
        {hasVideo ? (
          <video
            key={media?.videoUrl}
            className={`absolute inset-0 hidden h-full w-full object-cover object-center transition-opacity duration-700 md:block ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={fallbackImage}
            aria-label={media?.title || "Hero background video"}
            onCanPlay={() => setVideoReady(true)}
            onLoadedData={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
          >
            <source src={media?.videoUrl} type={media?.videoUrl?.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          </video>
        ) : null}
      </div>

      {hero ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-black/75 via-black/35 to-black/10 md:bg-gradient-to-r md:from-black/70 md:via-black/35 md:to-transparent" />
          <div className="absolute inset-0 z-10 flex items-end md:items-center">
            <div className="container-page w-full pb-16 pt-24 md:py-24">
              <div className="max-w-2xl">
                <span className="inline-flex items-center rounded-full border border-white/25 bg-black/30 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
                  {hero.eyebrow}
                </span>
                <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                  {hero.title}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
                  {hero.subtitle}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href={`/${lang}/store`} className="btn-primary">
                    {hero.primaryCta}
                  </Link>
                  <Link href={`/${lang}/repairs`} className="btn-secondary">
                    {hero.secondaryCta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {mobileSlides.length > 1 ? (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-2 backdrop-blur-md md:hidden">
          {mobileSlides.map((_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === activeMobileIndex ? "w-6 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
