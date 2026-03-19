"use client";

import { useEffect, useId, useState } from "react";

export default function BackToTopButton({ label = "Back to top" }: { label?: string }) {
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const tooltipId = useId();

  useEffect(() => {
    let ticking = false;
    let frameId: number | undefined;

    const onScroll = () => {
      if (!ticking) {
        frameId = window.requestAnimationFrame(() => {
          setVisible(window.scrollY > window.innerHeight);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check deferred to avoid synchronous setState in useEffect
    const initialFrameId = window.requestAnimationFrame(() => {
      setVisible(window.scrollY > window.innerHeight);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(initialFrameId);
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const showTooltip = visible && (isHovered || isFocused);

  return (
    <div
      className={`fixed bottom-28 right-6 z-50 flex items-center transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      {/* Tooltip */}
      <div
        id={tooltipId}
        role="tooltip"
        className={`absolute right-full mr-3 whitespace-nowrap rounded-lg border border-white/10 bg-surface/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-xl backdrop-blur-md transition-all duration-200 ${
          showTooltip
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-2 pointer-events-none"
        }`}
      >
        {label}
        {/* Tooltip Arrow */}
        <div className="absolute top-1/2 -right-1 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-white/10 bg-surface/90" />
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-surface text-gold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
        aria-label={label}
        aria-describedby={tooltipId}
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
