"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

type UseInViewOptions = {
  /** Threshold for triggering (0-1) */
  threshold?: number;
  /** Root margin for earlier/later triggering */
  rootMargin?: string;
  /** Only trigger once */
  triggerOnce?: boolean;
  /** Initial state (for SSR) */
  initialInView?: boolean;
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
 * Hook to detect when an element enters the viewport
 * Uses IntersectionObserver for performance
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
  initialInView = false,
}: UseInViewOptions = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [inView, setInView] = useState(() => initialInView || prefersReducedMotion);

  useEffect(() => {
    // If reduced motion, already set to true in initial state
    if (prefersReducedMotion) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, prefersReducedMotion]);

  return [ref, prefersReducedMotion ? true : inView];
}

/**
 * Hook to stagger animations for multiple elements
 */
export function useStaggeredInView<T extends HTMLElement = HTMLDivElement>(
  _itemCount: number,
  options: UseInViewOptions & { staggerDelay?: number } = {}
): [RefObject<T | null>, boolean, (index: number) => string] {
  const { staggerDelay = 100, ...inViewOptions } = options;
  const [ref, inView] = useInView<T>(inViewOptions);

  const getStaggerStyle = (): string => {
    if (!inView) return "opacity-0 translate-y-8";
    return `opacity-100 translate-y-0 transition-all duration-500 ease-out`;
  };

  const getStaggerDelay = (index: number): string => {
    return `${index * staggerDelay}ms`;
  };

  return [ref, inView, (index: number) => 
    `${getStaggerStyle()} [transition-delay:${getStaggerDelay(index)}]`
  ];
}

type AnimationVariant = 
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale-up"
  | "blur-in";

const animationClasses: Record<AnimationVariant, { hidden: string; visible: string }> = {
  "fade-up": {
    hidden: "opacity-0 translate-y-8",
    visible: "opacity-100 translate-y-0",
  },
  "fade-down": {
    hidden: "opacity-0 -translate-y-8",
    visible: "opacity-100 translate-y-0",
  },
  "fade-left": {
    hidden: "opacity-0 translate-x-8",
    visible: "opacity-100 translate-x-0",
  },
  "fade-right": {
    hidden: "opacity-0 -translate-x-8",
    visible: "opacity-100 translate-x-0",
  },
  "scale-up": {
    hidden: "opacity-0 scale-95",
    visible: "opacity-100 scale-100",
  },
  "blur-in": {
    hidden: "opacity-0 blur-sm",
    visible: "opacity-100 blur-0",
  },
};

/**
 * Hook for animated elements with preset variants
 */
export function useAnimateOnScroll<T extends HTMLElement = HTMLDivElement>(
  variant: AnimationVariant = "fade-up",
  options: UseInViewOptions & { delay?: number } = {}
): [RefObject<T | null>, string] {
  const { delay = 0, ...inViewOptions } = options;
  const [ref, inView] = useInView<T>(inViewOptions);

  const classes = animationClasses[variant];
  const baseTransition = "transition-all duration-700 ease-out";
  const delayStyle = delay > 0 ? `[transition-delay:${delay}ms]` : "";

  const animationClass = inView
    ? `${classes.visible} ${baseTransition} ${delayStyle}`
    : `${classes.hidden} ${baseTransition} ${delayStyle}`;

  return [ref, animationClass];
}
