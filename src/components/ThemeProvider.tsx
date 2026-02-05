"use client";

import { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "mono";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = "apfel-theme";
const DEFAULT_THEME: Theme = "mono";

// External store for theme (avoids setState in effect)
let currentTheme: Theme = DEFAULT_THEME;
const listeners = new Set<() => void>();

const themeStore = {
  getSnapshot: () => {
    if (typeof document !== "undefined") {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark" || attr === "mono") return attr;
    }
    return currentTheme;
  },
  getServerSnapshot: () => DEFAULT_THEME,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setTheme: (theme: Theme) => {
    currentTheme = theme;
    listeners.forEach(l => l());
  },
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Script to prevent flash of wrong theme
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var existing = document.documentElement.getAttribute('data-theme');
        var theme = existing && (existing === 'dark' || existing === 'mono') ? existing : null;
        if (!theme) {
          var cookieMatch = document.cookie.match(/(?:^|; )apfel-theme=([^;]+)/);
          var cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
          var stored = cookieTheme || localStorage.getItem('${THEME_STORAGE_KEY}') || '${DEFAULT_THEME}';
          theme = stored === 'dark' || stored === 'mono' ? stored : '${DEFAULT_THEME}';
          document.documentElement.setAttribute('data-theme', theme);
        }
        try {
          localStorage.setItem('${THEME_STORAGE_KEY}', theme);
          document.cookie = 'apfel-theme=' + theme + '; path=/; max-age=31536000';
        } catch (e) {}
      } catch (e) {
        document.documentElement.setAttribute('data-theme', '${DEFAULT_THEME}');
      }
    })();
  `;
  
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}

export default function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    () => initialTheme
  );
  
  // Initialize theme from localStorage on mount (only once)
  useEffect(() => {
    try {
      const attr = document.documentElement.getAttribute("data-theme") as Theme | null;
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      const cookieMatch = document.cookie.match(/(?:^|; )apfel-theme=([^;]+)/);
      const cookieTheme = cookieMatch ? (decodeURIComponent(cookieMatch[1]) as Theme) : null;
      const initialTheme = attr || cookieTheme || stored;
      if (initialTheme && (initialTheme === "dark" || initialTheme === "mono")) {
        themeStore.setTheme(initialTheme);
        document.documentElement.setAttribute("data-theme", initialTheme);
        localStorage.setItem(THEME_STORAGE_KEY, initialTheme);
        document.cookie = `apfel-theme=${initialTheme}; path=/; max-age=31536000`;
      } else {
        document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
        localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
        document.cookie = `apfel-theme=${DEFAULT_THEME}; path=/; max-age=31536000`;
      }
    } catch {
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    themeStore.setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.cookie = `apfel-theme=${newTheme}; path=/; max-age=31536000`;
    } catch {
      // localStorage not available
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const themeOrder: Theme[] = ["dark", "mono"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(nextTheme);
  }, [theme, setTheme]);

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
