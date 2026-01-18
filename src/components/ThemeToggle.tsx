"use client";

import { useEffect, useState } from "react";

const getPreferredTheme = () => {
  if (typeof window === "undefined") {
    return "dark";
  }
  const stored = window.localStorage.getItem("apfel-theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>("dark");

  useEffect(() => {
    setTheme(getPreferredTheme());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("apfel-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-full border border-border/60 bg-surface/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-foreground"
      aria-label="Toggle theme"
    >
      <span className="text-[10px]">{theme === "dark" ? "Night" : "Day"}</span>
      <span className="h-2 w-2 rounded-full bg-brand-gold shadow-gold" />
    </button>
  );
}
