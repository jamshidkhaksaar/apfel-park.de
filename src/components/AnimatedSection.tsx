"use client";

import { type ReactNode, type HTMLAttributes } from "react";
import { useAnimateOnScroll } from "../hooks/useInView";

type AnimationVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale-up"
  | "blur-in";

type AnimatedSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  /** Animation variant */
  animation?: AnimationVariant;
  /** Delay in ms before animation starts */
  delay?: number;
  /** Element tag to render */
  as?: "div" | "section" | "article" | "aside" | "header" | "footer";
  /** Threshold for triggering (0-1) */
  threshold?: number;
  /** Root margin for earlier/later triggering */
  rootMargin?: string;
};

/**
 * Wrapper component that animates children when scrolled into view.
 * Respects reduced motion preferences automatically.
 * 
 * @example
 * <AnimatedSection animation="fade-up" delay={200}>
 *   <h2>This will animate in when scrolled into view</h2>
 * </AnimatedSection>
 */
export default function AnimatedSection({
  children,
  animation = "fade-up",
  delay = 0,
  as: Element = "div",
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px",
  className = "",
  ...props
}: AnimatedSectionProps) {
  const [ref, , animationClass] = useAnimateOnScroll(animation, {
    delay,
    threshold,
    rootMargin,
    triggerOnce: true,
    initialInView: true,
  });

  return (
    <Element
      ref={ref}
      className={`${animationClass} ${className}`}
      {...props}
    >
      {children}
    </Element>
  );
}
