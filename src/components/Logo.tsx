"use client";

import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to wrap in a link to homepage */
  href?: string;
  /** Additional class names */
  className?: string;
  /** Show text alongside logo */
  showText?: boolean;
  /** Priority loading for LCP */
  priority?: boolean;
};

const sizeMap = {
  sm: { width: 40, height: 40, containerClass: "h-10 w-10" },
  md: { width: 64, height: 64, containerClass: "h-16 w-16" },
  lg: { width: 80, height: 80, containerClass: "h-20 w-20" },
  xl: { width: 108, height: 108, containerClass: "h-[108px] w-[108px]" },
} as const;

/**
 * Unified Logo component with theme-aware rendering.
 * 
 * Uses CSS filter inversion for dark theme instead of separate image files,
 * preventing hydration mismatches and layout shift during theme changes.
 * 
 * The logo.jpg is the "light" version (for light backgrounds).
 * In dark theme, CSS filter inverts it for proper visibility.
 */
export default function Logo({
  size = "md",
  href,
  className = "",
  showText = false,
  priority = false,
}: LogoProps) {
  const { width, height, containerClass } = sizeMap[size];

  const logoImage = (
    <div
      className={`logo-stack relative ${containerClass} ${className}`}
      suppressHydrationWarning
    >
      <Image
        src="/branding/logo.jpg"
        alt="Apfel Park"
        width={width}
        height={height}
        className="logo-image logo-image-default rounded-xl object-contain shadow-lg"
        style={{ width: "100%", height: "100%" }}
        priority={priority}
        suppressHydrationWarning
      />
      <Image
        src="/branding/apfel-park-white.png"
        alt="Apfel Park"
        width={width}
        height={height}
        className="logo-image logo-image-mono rounded-xl object-contain shadow-lg"
        style={{ width: "100%", height: "100%" }}
        priority={priority}
        suppressHydrationWarning
      />
    </div>
  );

  const content = showText ? (
    <div className="flex items-center gap-3">
      {logoImage}
      <div>
        <p className="text-xl font-bold text-foreground tracking-tight md:text-2xl">
          Apfel Park
        </p>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          Sell & Repair
        </p>
      </div>
    </div>
  ) : (
    logoImage
  );

  if (href) {
    return (
      <Link 
        href={href} 
        className="group inline-flex items-center transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
        aria-label="Apfel Park - Back to homepage"
      >
        {content}
      </Link>
    );
  }

  return content;
}
