"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type PageTransitionProps = {
  children: ReactNode;
};

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
