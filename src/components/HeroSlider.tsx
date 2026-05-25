"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import type { Locale } from "../lib/i18n";
import type { HeroMediaSettings } from "../lib/site-settings-server";

export default function HeroSlider({
  lang,
  media,
}: {
  lang: Locale;
  media?: HeroMediaSettings | null;
}) {
  const [videoReady, setVideoReady] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const fallbackImage = media?.posterUrl || media?.fallbackImageUrl || "/images/shop2.jpg";
  const useUnoptimizedImage = fallbackImage.startsWith("/uploads/");
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
          {mobileSlides.map((slide, index) => (
            <Image
              key={`${slide}-${index}`}
              src={slide}
              alt={lang === "de" ? "Apfel Park Store in Hamburg" : "Apfel Park Store in Hamburg"}
              fill
              priority={index === 0}
              sizes="100vw"
              unoptimized={slide.startsWith("/uploads/")}
              className={`object-cover object-center transition-all duration-[1400ms] ease-out ${
                index === activeMobileIndex ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
              }`}
            />
          ))}
          {mobileSlides.length > 1 ? (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-2 backdrop-blur-md">
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
            preload="auto"
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
    </section>
  );
}
