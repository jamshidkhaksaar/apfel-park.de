"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const isMono = theme === "mono";

  return (
    <div
      role="radiogroup"
      className="relative flex h-9 items-center gap-1 rounded-full border border-white/10 bg-surface/80 px-1 backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-surface-strong/80 focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-2 focus-within:ring-offset-background"
      aria-label="Theme selector"
    >
      {/* Dark/Gold */}
      <button
        type="button"
        role="radio"
        onClick={() => setTheme("dark")}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
          isDark
            ? "bg-gold text-contrast-adaptive shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            : "text-muted-strong hover:text-muted hover:bg-white/5"
        }`}
        aria-checked={isDark}
        aria-label="Dark theme with gold accents"
        title="Dark (Gold)"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>

      {/* Mono/Black-White */}
      <button
        type="button"
        role="radio"
        onClick={() => setTheme("mono")}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-surface ${
          isMono
            ? "bg-foreground text-background shadow-[0_0_12px_rgba(255,255,255,0.2)]"
            : "text-muted-strong hover:text-muted hover:bg-white/5"
        }`}
        aria-checked={isMono}
        aria-label="Light theme with black and white"
        title="Black & White"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 0v18"
          />
        </svg>
      </button>
    </div>
  );
}
