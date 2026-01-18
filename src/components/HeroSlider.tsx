"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

import type { Locale } from "../lib/i18n";

type Slide = {
  image: string;
  title: { de: string; en: string };
  subtitle: { de: string; en: string };
  cta: { de: string; en: string };
  path: string;
};

const slides: Slide[] = [
  {
    image: "/images/slider_images/iphone.png",
    title: {
      de: "iPhone Reparatur",
      en: "iPhone Repair",
    },
    subtitle: {
      de: "Express-Reparatur in unter 30 Minuten. Display, Akku, Kamera und mehr.",
      en: "Express repair in under 30 minutes. Screen, battery, camera and more.",
    },
    cta: {
      de: "Jetzt reparieren",
      en: "Repair Now",
    },
    path: "/repairs",
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
    image: "/images/slider_images/laptop.png",
    title: {
      de: "Laptop & MacBook Service",
      en: "Laptop & MacBook Service",
    },
    subtitle: {
      de: "Professionelle Reparaturen, Upgrades und Wartung für alle Laptops.",
      en: "Professional repairs, upgrades and maintenance for all laptops.",
    },
    cta: {
      de: "Service anfragen",
      en: "Request Service",
    },
    path: "/services",
  },
  {
    image: "/images/slider_images/ps5.png",
    title: {
      de: "PlayStation & Gaming",
      en: "PlayStation & Gaming",
    },
    subtitle: {
      de: "Konsolen-Reparatur, Controller-Service und Gaming-Zubehör.",
      en: "Console repair, controller service and gaming accessories.",
    },
    cta: {
      de: "Gaming entdecken",
      en: "Explore Gaming",
    },
    path: "/gaming",
  },
];

export default function HeroSlider({ lang }: { lang: Locale }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
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
          key={s.path}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={s.image}
            alt={s.title[lang]}
            fill
            className="object-cover"
            priority={index === 0}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>
      ))}

      {/* Content */}
      <div className="container-page relative z-10 flex h-full items-center">
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold backdrop-blur-sm">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-gold" />
            {lang === "de" ? "Jetzt verfügbar" : "Available Now"}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            {slide.title[lang]}
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-white/80 md:text-xl">
            {slide.subtitle[lang]}
          </p>

          {/* CTA Button */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href={`/${lang}${slide.path}`}
              className="btn-primary text-base"
            >
              {slide.cta[lang]}
              <svg
                className="h-5 w-5"
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
            <Link
              href={`/${lang}/contact`}
              className="btn-secondary text-base"
            >
              {lang === "de" ? "Kontakt" : "Contact"}
            </Link>
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
