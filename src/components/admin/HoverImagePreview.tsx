"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

/**
 * Wraps a thumbnail: hovering it with a mouse opens a large preview next to
 * the cursor (kept inside the window). Touch devices keep the normal tap.
 */
export default function HoverImagePreview({
  src,
  alt,
  children,
}: {
  src: string | null;
  alt: string;
  children: ReactNode;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const size = 420;

  const move = (event: React.MouseEvent) => {
    if (!src) return;
    const gap = 24;
    const x = event.clientX + gap + size > window.innerWidth ? event.clientX - gap - size : event.clientX + gap;
    const y = Math.min(Math.max(12, event.clientY - size / 2), window.innerHeight - size - 12);
    setPos({ x: Math.max(12, x), y });
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={move}
      onMouseMove={move}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {src && pos ? (
        <span
          role="presentation"
          className="pointer-events-none fixed z-[200] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-black/40"
          style={{ left: pos.x, top: pos.y, width: size, height: size }}
        >
          <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-contain p-3" unoptimized={src.startsWith("/uploads/")} />
        </span>
      ) : null}
    </span>
  );
}
