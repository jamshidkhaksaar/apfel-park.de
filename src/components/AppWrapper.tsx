"use client";

import { useEffect, useSyncExternalStore } from "react";
import LoadingScreen from "./LoadingScreen";
import WhatsAppFloat from "./WhatsAppFloat";

type AppWrapperProps = {
  children: React.ReactNode;
  lang: "de" | "en";
};

let hasLoadedState = false;
const loadingListeners = new Set<() => void>();

const loadingStore = {
  getSnapshot: () => hasLoadedState,
  getServerSnapshot: () => false,
  subscribe: (listener: () => void) => {
    loadingListeners.add(listener);
    return () => loadingListeners.delete(listener);
  },
  setHasLoaded: (value: boolean) => {
    if (hasLoadedState === value) return;
    hasLoadedState = value;
    loadingListeners.forEach((listener) => listener());
  },
};

export default function AppWrapper({ children, lang }: AppWrapperProps) {
  const hasLoaded = useSyncExternalStore(
    loadingStore.subscribe,
    loadingStore.getSnapshot,
    loadingStore.getServerSnapshot,
  );

  useEffect(() => {
    try {
      const buildId = (window as { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__?.buildId;
      if (!buildId) return;

      const storageKey = "apfel-build-id";
      const stored = localStorage.getItem(storageKey);

      if (stored && stored !== buildId) {
        localStorage.setItem(storageKey, buildId);
        window.location.reload();
        return;
      }

      if (!stored) {
        localStorage.setItem(storageKey, buildId);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("apfel-loaded");
      loadingStore.setHasLoaded(Boolean(stored));
    } catch {
      loadingStore.setHasLoaded(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    try {
      sessionStorage.setItem("apfel-loaded", "true");
    } catch {
      // sessionStorage not available
    }
    loadingStore.setHasLoaded(true);
  };

  const isLoading = !hasLoaded;

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} minDisplayTime={2500} />}
      <div
        className={`relative z-10 transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
      <WhatsAppFloat lang={lang} />
    </>
  );
}
