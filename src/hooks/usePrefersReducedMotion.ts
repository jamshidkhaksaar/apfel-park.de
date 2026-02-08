"use client";

import { useCallback, useSyncExternalStore } from "react";

let reducedMotionQuery: MediaQueryList | null = null;

const getReducedMotionQuery = (): MediaQueryList | null => {
  if (typeof window === "undefined") return null;
  if (!reducedMotionQuery) {
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return reducedMotionQuery;
};

export const usePrefersReducedMotion = (): boolean => {
  const subscribe = useCallback((callback: () => void) => {
    const query = getReducedMotionQuery();
    if (!query) return () => {};

    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
  }, []);

  const getSnapshot = () => getReducedMotionQuery()?.matches ?? false;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
