"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

import type { Locale } from "../lib/i18n";
import { siteInfo } from "../lib/site";
import { useTheme } from "./ThemeProvider";

type Slide = {
  image: string;
  title: { de: string; en: string };
  subtitle: { de: string; en: string };
  cta: { de: string; en: string };
  path: string;
  type?: "default" | "social";
};

const slides: Slide[] = [
  {
    image: "/images/slider_images/iphone.png",
    title: {
      de: "iPhone Verkauf & Reparatur",
      en: "iPhone Sales & Repair",
    },
    subtitle: {
      de: "Neue & gebrauchte iPhones kaufen. Express-Reparatur in unter 30 Minuten.",
      en: "Buy new & refurbished iPhones. Express repair in under 30 minutes.",
    },
    cta: {
      de: "Jetzt entdecken",
      en: "Explore Now",
    },
    path: "/smartphones",
  },
  {
    image: "/images/slider_images/laptop.png",
    title: {
      de: "Laptops Verkauf & Reparatur",
      en: "Laptops Sales & Repair",
    },
    subtitle: {
      de: "MacBooks, Windows-Laptops kaufen & reparieren. Professioneller Service für alle Marken.",
      en: "Buy & repair MacBooks, Windows laptops. Professional service for all brands.",
    },
    cta: {
      de: "Laptops entdecken",
      en: "Explore Laptops",
    },
    path: "/laptops",
  },
  {
    image: "/images/slider_images/ps5.png",
    title: {
      de: "Konsolen Verkauf & Reparatur",
      en: "Console Sales & Repair",
    },
    subtitle: {
      de: "PlayStation, Xbox, Nintendo Switch – kaufen, verkaufen & reparieren lassen.",
      en: "PlayStation, Xbox, Nintendo Switch – buy, sell & get repairs.",
    },
    cta: {
      de: "Gaming entdecken",
      en: "Explore Gaming",
    },
    path: "/gaming",
  },
  {
    image: "/images/slider_images/accessories.png",
    title: {
      de: "Premium Zubehör",
      en: "Premium Accessories",
    },
    subtitle: {
      de: "Hochwertige Cases, Ladegeräte, Kopfhörer und mehr für dein Gerät.",
      en: "High-quality cases, chargers, headphones and more for your device.",
    },
    cta: {
      de: "Zubehör entdecken",
      en: "Explore Accessories",
    },
    path: "/accessories",
  },
  {
    image: "/images/slider_images/iphone.png",
    title: {
      de: "Professioneller Service",
      en: "Professional Service",
    },
    subtitle: {
      de: "Experten-Reparatur & persönliche Beratung. Folge uns für Updates & Angebote!",
      en: "Expert repairs & personal advice. Follow us for updates & offers!",
    },
    cta: {
      de: "Kontakt aufnehmen",
      en: "Get in Touch",
    },
    path: "/contact",
    type: "social",
  },
];

export default function HeroSlider({ lang }: { lang: Locale }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  // Bolt: Lazy load images to improve initial load performance
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));
  const { theme } = useTheme();

  const oceanImages = [
    "/images/slider_ocean/iphones.png",
    "/images/slider_ocean/laptop.png",
    "/images/slider_ocean/console.png",
    "/images/slider_ocean/accessories.png",
    "/images/slider_ocean/iphones.png",
  ];

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index);
    setLoadedIndices((prev) => {
      const nextIndex = (index + 1) % slides.length;
      if (prev.has(index) && prev.has(nextIndex)) return prev;

      const next = new Set(prev);
      next.add(index);
      next.add(nextIndex);
      return next;
    });
  }, []);

  const nextSlide = useCallback(() => {
    handleSlideChange((currentSlide + 1) % slides.length);
  }, [currentSlide, handleSlideChange]);

  const prevSlide = () => {
    handleSlideChange((currentSlide - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    handleSlideChange(index);
    setIsAutoPlaying(false);
    // Resume autoplay after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[500px] w-full overflow-hidden md:h-[600px] lg:h-[700px]">
      {/* Slides */}
      {slides.map((s, index) => (
        <div
          key={s.path + index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {loadedIndices.has(index) && (
            <Image
              src={theme === "ocean" ? oceanImages[index] ?? s.image : s.image}
              alt={s.title[lang]}
              fill
              className="object-cover"
              priority={index === 0}
            />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 hero-overlay-1" />
          <div className="absolute inset-0 hero-overlay-2" />
        </div>
      ))}

      {/* Content */}
      <div className="container-page relative z-10 flex h-full items-center">
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold backdrop-blur-sm">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-gold" />
            {slide.type === "social" 
              ? (lang === "de" ? "Folge uns" : "Follow Us")
              : (lang === "de" ? "Verkauf & Reparatur" : "Sales & Repair")
            }
          </div>

          {/* Title */}
          <h1 className="text-gold-metallic text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl pb-2">
            {slide.title[lang]}
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gold-soft md:text-xl font-medium">
            {slide.subtitle[lang]}
          </p>

          {/* CTA Button & Social Links */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={`/${lang}${slide.path}`}
              className="btn-primary text-base"
            >
              <span className="relative z-10">{slide.cta[lang]}</span>
              <svg
                className="relative z-10 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>

            {/* Show social buttons on service slide */}
            {slide.type === "social" ? (
              <div className="flex items-center gap-3">
                {/* Instagram */}
                <a
                  href={siteInfo.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm transition-all hover:scale-110 hover:border-pink-500/50 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={siteInfo.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm transition-all hover:scale-110 hover:border-blue-500/50 hover:bg-blue-600"
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href={siteInfo.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm transition-all hover:scale-110 hover:border-white/50 hover:bg-black"
                  aria-label="TikTok"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href={siteInfo.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-sm transition-all hover:scale-110 hover:border-green-500/50 hover:bg-green-600"
                  aria-label="WhatsApp"
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            ) : (
              <Link
                href={`/${lang}/contact`}
                className="btn-secondary text-base"
              >
                {lang === "de" ? "Kontakt" : "Contact"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 md:left-8"
        aria-label="Previous slide"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 md:right-8"
        aria-label="Next slide"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentSlide
                ? "w-8 bg-gold"
                : "w-3 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/10">
        <div
          className="h-full bg-gold transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </section>
  );
}
