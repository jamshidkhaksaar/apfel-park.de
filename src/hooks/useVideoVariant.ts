"use client";

import { useCallback, useSyncExternalStore } from "react";

// Resolves to null on the server and during hydration, then to the best video
// rendition for the visitor: "mobile" on small screens or with Data Saver on,
// otherwise "desktop". Returning null until mounted keeps the large desktop
// source out of the server-rendered markup, so it can never start downloading
// before the client has chosen the right rendition.
export type VideoVariant = "mobile" | "desktop";

let compactQuery: MediaQueryList | null = null;

const getCompactQuery = (): MediaQueryList | null => {
  if (typeof window === "undefined") return null;
  if (!compactQuery) {
    compactQuery = window.matchMedia("(max-width: 767px)");
  }
  return compactQuery;
};

const getSnapshot = (): VideoVariant => {
  const small = getCompactQuery()?.matches ?? false;
  const connection = typeof navigator !== "undefined"
    ? (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    : undefined;
  return small || connection?.saveData === true ? "mobile" : "desktop";
};

const getServerSnapshot = (): VideoVariant | null => null;

export const useVideoVariant = (): VideoVariant | null => {
  const subscribe = useCallback((callback: () => void) => {
    const query = getCompactQuery();
    if (!query) return () => {};

    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
