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
  const [ref, animationClass] = useAnimateOnScroll(animation, {
    delay,
    threshold,
    rootMargin,
    triggerOnce: true,
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

type AnimatedListProps = {
  children: ReactNode[];
  /** Base animation variant */
  animation?: AnimationVariant;
  /** Stagger delay between items in ms */
  staggerDelay?: number;
  /** Container class name */
  className?: string;
  /** Wrapper element for each item */
  itemWrapper?: "div" | "li" | "article";
};

/**
 * Renders a list of items with staggered scroll animations.
 * 
 * @example
 * <AnimatedList animation="fade-up" staggerDelay={100}>
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </AnimatedList>
 */
export function AnimatedList({
  children,
  animation = "fade-up",
  staggerDelay = 100,
  className = "",
  itemWrapper: ItemWrapper = "div",
}: AnimatedListProps) {
  const [ref, inView] = useAnimateOnScroll(animation, {
    threshold: 0.05,
    rootMargin: "0px 0px -20px 0px",
  });

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <ItemWrapper
          key={index}
          className={`transition-all duration-500 ease-out ${
            inView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
          style={{
            transitionDelay: inView ? `${index * staggerDelay}ms` : "0ms",
          }}
        >
          {child}
        </ItemWrapper>
      ))}
    </div>
  );
}
