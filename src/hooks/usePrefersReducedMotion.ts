"use client";

import { useSyncExternalStore, useCallback } from "react";

// Singleton MediaQueryList to avoid creating new instances repeatedly
let reducedMotionQuery: MediaQueryList | null = null;

function getReducedMotionQuery() {
  if (typeof window === "undefined") return null;
  if (!reducedMotionQuery) {
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return reducedMotionQuery;
}

/**
 * Hook to get reduced motion preference (hydration-safe)
 */
export function usePrefersReducedMotion(): boolean {
  const subscribe = useCallback((callback: () => void) => {
    const mq = getReducedMotionQuery();
    if (!mq) return () => {};
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  }, []);

  const getSnapshot = () => getReducedMotionQuery()?.matches ?? false;

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
