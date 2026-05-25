"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  title: string;
  images: string[];
};

export default function ProductGallery({ title, images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const activeImage = images[activeIndex] ?? images[0] ?? "";

  if (!activeImage) {
    return null;
  }

  const switchTo = (index: number) => {
    if (index === activeIndex) return;
    setFading(true);
    setTimeout(() => {
      setActiveIndex(index);
      setFading(false);
    }, 180);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[32px] border border-border/60 bg-[#f5f5f5] p-4 shadow-2xl">
        <div className="relative aspect-square overflow-hidden rounded-[28px] bg-[#f5f5f5]">
          <Image
            key={activeImage}
            src={activeImage}
            alt={title}
            fill
            priority
            className={`object-contain p-6 transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
            sizes="(max-width: 1280px) 100vw, 760px"
            unoptimized={activeImage.startsWith("/uploads/")}
          />
        </div>
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => switchTo(index)}
              className={`relative overflow-hidden rounded-2xl border bg-[#f5f5f5] transition-all duration-200 ${
                activeIndex === index
                  ? "border-gold/60 ring-2 ring-gold/30 scale-[1.03]"
                  : "border-border/60 hover:border-gold/30 hover:scale-[1.02]"
              }`}
            >
              <div className="relative aspect-square">
                <Image
                  src={image}
                  alt={`${title} ${index + 1}`}
                  fill
                  className={`object-contain p-2 transition-opacity duration-200 ${activeIndex === index ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                  sizes="160px"
                  unoptimized={image.startsWith("/uploads/")}
                />
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
