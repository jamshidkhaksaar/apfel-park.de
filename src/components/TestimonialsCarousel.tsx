"use client";

import { useState, useEffect, useCallback } from "react";

type Review = {
  readonly name: string;
  readonly badge: string;
  readonly timeAgo: string;
  readonly quote: string;
  readonly rating: number;
};

type TestimonialsCarouselProps = {
  reviews: readonly Review[];
  lang: "de" | "en";
};

export default function TestimonialsCarousel({ reviews, lang }: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % totalPages);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, totalPages]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating, totalPages]);

  // Auto-slide every 6 seconds
  useEffect(() => {
    const interval = setInterval(goToNext, 6000);
    return () => clearInterval(interval);
  }, [goToNext]);

  const currentReviews = reviews.slice(
    currentIndex * reviewsPerPage,
    currentIndex * reviewsPerPage + reviewsPerPage
  );

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Truncate long quotes
  const truncateQuote = (quote: string, maxLength: number = 180) => {
    if (quote.length <= maxLength) return quote;
    return quote.slice(0, maxLength).trim() + "...";
  };

  return (
    <div className="relative">
      {/* Reviews Grid */}
      <div className="relative overflow-hidden">
        <div
          className={`grid gap-6 md:grid-cols-3 transition-all duration-500 ease-out ${
            isAnimating
              ? direction === "next"
                ? "opacity-0 translate-x-8"
                : "opacity-0 -translate-x-8"
              : "opacity-100 translate-x-0"
          }`}
        >
          {currentReviews.map((review, index) => (
            <div
              key={`${currentIndex}-${index}`}
              className="review-bubble group relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* 3D Bubble Container */}
                <div className="review-bubble-card relative overflow-visible">
                {/* Bubble Shadow - Creates 3D depth */}
                <div className="absolute -bottom-3 left-4 right-4 h-8 rounded-[50%] bg-black/20 blur-xl transition-all duration-500 group-hover:-bottom-4 group-hover:bg-gold/20 group-hover:blur-2xl" />
                
                {/* Main Bubble Shape */}
                  <div className="review-bubble-shell relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0f0f0f] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:border-gold/30 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(245,158,11,0.1)]">
                  
                  {/* Inner Glow Effect */}
                  <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-gold/5 via-transparent to-amber/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  
                  {/* Shine Effect on Hover */}
                  <div className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, transparent 50%, transparent 100%)"
                  }} />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Star Rating */}
                    <div className="mb-4 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 transition-transform duration-300 ${i < review.rating ? "text-gold" : "text-white/20"}`}
                          style={{ transitionDelay: `${i * 50}ms` }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-xs text-muted transition-colors duration-300 group-hover:text-gold/70">{review.timeAgo}</span>
                    </div>

                    {/* Quote */}
                    <div className="relative mb-6">
                      {/* Quote Mark */}
                      <svg className="absolute -left-1 -top-2 h-8 w-8 text-gold/20 transition-all duration-500 group-hover:scale-110 group-hover:text-gold/40" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <p className="pl-6 text-sm leading-relaxed text-foreground/90 transition-colors duration-300 group-hover:text-foreground">
                        {truncateQuote(review.quote)}
                      </p>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      {/* Avatar with Gold Ring */}
                      <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold/60 to-amber/60 opacity-0 blur-sm transition-all duration-500 group-hover:opacity-100" />
                        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold to-amber text-sm font-bold text-background shadow-lg transition-transform duration-500 group-hover:scale-110">
                          {getInitials(review.name)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground transition-colors duration-300 group-hover:text-gold">{review.name}</p>
                        <div className="flex items-center gap-2">
                          <svg className="h-3 w-3 text-gold/60 transition-colors duration-300 group-hover:text-gold" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                          </svg>
                          <span className="text-xs text-muted">{review.badge}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bubble Tail - Speech bubble pointer */}
                <div className="absolute -bottom-3 left-10 h-6 w-6 overflow-hidden">
                  <div className="review-bubble-tail absolute -top-3 left-0 h-6 w-6 rotate-45 border-b border-r border-white/10 bg-gradient-to-br from-[#141414] to-[#0f0f0f] shadow-lg transition-all duration-500 group-hover:border-gold/30 group-hover:shadow-gold/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-center gap-6">
        {/* Prev Button */}
        <button
          onClick={goToPrev}
          disabled={isAnimating}
          className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface/80 backdrop-blur-sm transition-all hover:border-gold/50 hover:bg-gold/10 disabled:opacity-50"
          aria-label={lang === "de" ? "Vorherige" : "Previous"}
        >
          <svg className="h-5 w-5 text-muted transition-colors group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="flex items-center gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (isAnimating) return;
                setIsAnimating(true);
                setDirection(i > currentIndex ? "next" : "prev");
                setCurrentIndex(i);
                setTimeout(() => setIsAnimating(false), 600);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-8 bg-gradient-to-r from-gold to-amber"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`${lang === "de" ? "Seite" : "Page"} ${i + 1}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          disabled={isAnimating}
          className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface/80 backdrop-blur-sm transition-all hover:border-gold/50 hover:bg-gold/10 disabled:opacity-50"
          aria-label={lang === "de" ? "Nächste" : "Next"}
        >
          <svg className="h-5 w-5 text-muted transition-colors group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Google Rating Summary */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="h-6 w-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
        <span className="text-sm text-muted">
          <span className="font-semibold text-foreground">4.9</span> {lang === "de" ? "von 5" : "out of 5"} · Google Reviews
        </span>
      </div>
    </div>
  );
}
