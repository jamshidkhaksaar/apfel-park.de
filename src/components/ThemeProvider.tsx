"use client";

import { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "ocean";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = "apfel-theme";
const DEFAULT_THEME: Theme = "ocean"; // Ocean is now default

// External store for theme (avoids setState in effect)
let currentTheme: Theme = DEFAULT_THEME;
const listeners = new Set<() => void>();

const themeStore = {
  getSnapshot: () => currentTheme,
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
        var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || '${DEFAULT_THEME}';
        document.documentElement.setAttribute('data-theme', theme);
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

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  );
  
  const [initialized, setInitialized] = useState(false);

  // Initialize theme from localStorage on mount (only once)
  useEffect(() => {
    if (initialized) return;
    
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored && (stored === "dark" || stored === "ocean")) {
        themeStore.setTheme(stored);
        document.documentElement.setAttribute("data-theme", stored);
      } else {
        document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
        localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
      }
    } catch {
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME);
    }
    
    setInitialized(true);
  }, [initialized]);

  const setTheme = useCallback((newTheme: Theme) => {
    themeStore.setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // localStorage not available
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "ocean" : "dark";
    setTheme(newTheme);
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
