"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useSyncExternalStore } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * Hook to get reduced motion preference (hydration-safe)
 */
function usePrefersReducedMotion(): boolean {
  const subscribe = (callback: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  };

  const getSnapshot = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Provides smooth page transitions between route changes.
 * Uses CSS-only approach with key-based remounting for animation.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  // Key change triggers CSS animation on remount
  return (
    <div
      key={pathname}
      className="animate-page-enter"
    >
      {children}
    </div>
  );
}

/**
 * Hook for programmatic page transition control
 */
export function usePageTransition() {
  return {
    isNavigating: false,
    startTransition: () => {},
    endTransition: () => {},
  };
}
