"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isOcean = theme === "ocean";
  const isDark = theme === "dark";
  const isMono = theme === "mono";

  return (
    <div
      role="group"
      className="relative flex h-8 items-center gap-1 rounded-full border border-white/10 bg-surface/80 px-1 backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-surface-strong/80"
      aria-label="Theme selector"
    >
      {/* Dark/Gold */}
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
          isDark
            ? "bg-gold text-contrast-adaptive shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            : "text-muted-strong hover:text-muted"
        }`}
        aria-pressed={isDark}
        aria-label="Switch to dark theme"
        title="Dark (Gold)"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>

      {/* Ocean/Blue */}
      <button
        type="button"
        onClick={() => setTheme("ocean")}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
          isOcean
            ? "bg-ocean text-white shadow-[0_0_12px_rgba(14,165,233,0.5)]"
            : "text-muted-strong hover:text-muted"
        }`}
        aria-pressed={isOcean}
        aria-label="Switch to ocean theme"
        title="Ocean Blue"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 15c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3M3 19c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3M3 11c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3"
          />
        </svg>
      </button>

      {/* Mono/Black-White */}
      <button
        type="button"
        onClick={() => setTheme("mono")}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
          isMono
            ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.35)]"
            : "text-muted-strong hover:text-muted"
        }`}
        aria-pressed={isMono}
        aria-label="Switch to black and white theme"
        title="Black & White"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
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
