"use client";

import { useEffect, useState } from "react";

export default function BackToTopButton({ label = "Back to top" }: { label?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Show button after scrolling down 1 viewport height
          // Using window.innerHeight avoids forcing layout/reflow from scrollHeight
          setVisible(window.scrollY > window.innerHeight);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-28 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-surface text-gold shadow-lg transition-all duration-300 hover:translate-y-[-2px] hover:border-gold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-label={label}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
