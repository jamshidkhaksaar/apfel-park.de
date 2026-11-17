import Image from "next/image";

import type { ShowcaseSlide } from "@/lib/black-friday-categories";

/**
 * Animated product showcase: three slides crossfade in a 9-second loop
 * (`bf-slide` in globals.css). Scenes slowly zoom; cut-out products float on
 * a brand-coloured glow. CSS only; under reduced motion the first slide stays.
 */
export default function BlackFridayShowcase({
  slides,
  glow,
  sizes,
  priority = false,
  className = "",
}: {
  slides: ShowcaseSlide[];
  glow: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`bf-showcase block overflow-hidden ${className.includes("absolute") ? "" : "relative"} ${className}`}
    >
      <span className="absolute inset-0" style={{ background: `radial-gradient(60% 55% at 50% 58%, ${glow}, transparent 72%)` }} />
      <span className="bf-orbit absolute left-1/2 top-1/2 aspect-square h-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[color:var(--bf-gold-3)]/30" />
      {slides.slice(0, 3).map((slide, index) => (
        <span key={slide.src} className={`bf-slide bf-slide-${index} absolute inset-0`}>
          {slide.kind === "scene" ? (
            <>
              <Image src={slide.src} alt="" fill sizes={sizes} priority={priority && index === 0} className="bf-slide-scene object-cover" />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.05)_40%,rgba(8,8,10,0.85)_100%)]" />
            </>
          ) : (
            <span className="bf-slide-cutout absolute inset-[10%_14%_6%]">
              <Image src={slide.src} alt="" fill sizes={sizes} priority={priority && index === 0} className="object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.75)]" />
            </span>
          )}
        </span>
      ))}
      {/* Floor reflection line under floating products */}
      <span className="absolute inset-x-[18%] bottom-[5%] h-px bg-[linear-gradient(90deg,transparent,var(--bf-gold-3),transparent)] opacity-60" />
    </span>
  );
}
