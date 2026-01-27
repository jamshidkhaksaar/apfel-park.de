"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isOcean = theme === "ocean";

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex h-8 items-center gap-1 rounded-full border border-white/10 bg-surface/80 px-1 backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-surface-strong/80"
      aria-label={isOcean ? "Switch to dark theme" : "Switch to ocean theme"}
      title={isOcean ? "Switch to dark theme" : "Switch to ocean theme"}
    >
      {/* Ocean/Wave Icon */}
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
          isOcean
            ? "bg-ocean text-white shadow-[0_0_12px_rgba(14,165,233,0.5)]"
            : "text-muted-strong hover:text-muted"
        }`}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {/* Wave icon */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 15c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3M3 19c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3M3 11c2.483 0 4.345-1.5 6-3 1.655 1.5 3.517 3 6 3s4.345-1.5 6-3"
          />
        </svg>
      </div>

      {/* Moon/Dark Icon */}
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
          !isOcean
            ? "bg-gold text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            : "text-muted-strong hover:text-muted"
        }`}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {/* Moon icon */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
    </button>
  );
}
