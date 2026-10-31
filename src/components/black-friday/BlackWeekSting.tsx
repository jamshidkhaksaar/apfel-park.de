"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/** One showing per browser session; a reload must not repeat the gesture. */
const STING_KEY = "apfel-bf-sting";
/** Matches the hand and wordmark timelines in globals.css, plus a little slack. */
const STING_MS = 6400;

type Placement = {
  /** Fingertip x, measured from the clipping layer. */
  x: number;
  /** Target centre y, measured from the clipping layer. */
  y: number;
  /** How far the hand travels out of the logo. */
  dx: number;
  /** Left edge of the wordmark, just past the logo. */
  wordLeft: number;
};

/**
 * First-visit gesture for the campaign entry: a hand slides out from the logo
 * and taps the Black Week pill, then the wordmark wipes out from behind the
 * logo. Purely decorative — the pill stays the accessible control, the layer
 * cannot receive pointer events, and reduced motion skips the whole sequence.
 */
export default function BlackWeekSting({ label, date }: { label: string; date: string }) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [active, setActive] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes("/black-friday")) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 1280px)").matches) return;
    if (window.scrollY > 40) return;
    if (document.documentElement.hasAttribute("data-header-reflowed")) return;
    try {
      if (window.sessionStorage.getItem(STING_KEY)) return;
    } catch {
      return;
    }

    const layer = layerRef.current;
    const shell = layer?.parentElement;
    if (!layer || !shell) return;

    const target = [...document.querySelectorAll<HTMLElement>("[data-campaign-target]")].find(
      (element) => element.getClientRects().length > 0,
    );
    const logo = shell.querySelector<HTMLElement>(".navbar-logo-slot");
    if (!target || !logo) return;

    const base = layer.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();
    const x = Math.round(rect.left - base.left - 8);
    const y = Math.round(rect.top - base.top + rect.height / 2);
    const wordLeft = Math.round(logoRect.right - base.left + 8);
    // A squeezed bar (tablet action pill, wrapped nav) is not worth a long
    // hand path across the header; skip rather than point at the wrong place.
    if (x - logoRect.right < 24 || x > base.width * 0.6) return;

    const controller = new AbortController();
    const finish = () => {
      setActive(false);
      controller.abort();
    };
    let timer = 0;

    const start = window.setTimeout(() => {
      setPlacement({ x, y, dx: Math.round(logoRect.right - base.left - x), wordLeft });
      setActive(true);
      try {
        window.sessionStorage.setItem(STING_KEY, "1");
      } catch {
        // Private mode: the gesture simply repeats on the next page view.
      }
      timer = window.setTimeout(finish, STING_MS);
    }, 700);

    const onScroll = () => {
      if (window.scrollY > 40) finish();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("scroll", onScroll, { passive: true, signal: controller.signal });
    window.addEventListener("resize", finish, { signal: controller.signal });
    window.addEventListener("pointerdown", finish, { signal: controller.signal });
    window.addEventListener("keydown", onKey, { signal: controller.signal });

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timer);
      controller.abort();
      setActive(false);
    };
  }, [pathname]);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      data-bf-sting
      className="bf-sting-layer pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {active && placement ? (
        <>
          <span
            data-bf-sting-hand
            className="bf-sting-hand"
            style={
              {
                left: `${placement.x}px`,
                top: `${placement.y}px`,
                "--bf-hand-dx": `${placement.dx}px`,
              } as CSSProperties
            }
          >
            <svg viewBox="0 0 72 52" className="size-full overflow-visible" role="presentation" focusable="false">
              <g stroke="#08080a" strokeWidth="1.5" strokeLinejoin="round">
                <rect x="1.2" y="12" width="12" height="30" rx="5" fill="var(--signal)" />
                <path d="M4.4 17.5h5.6M4.4 36.5h5.6" stroke="#08080a" strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
                <path d="M13 16.5h7.4v21H13z" fill="#f2ede4" />
                <path
                  d="M19.5 20h14.2c4.1 0 7.3 3.2 7.3 7.2v8.4c0 5.2-4.2 9.4-9.4 9.4h-7.2c-5.1 0-9.2-4.1-9.2-9.2V25.3c0-3 2.4-5.3 5.3-5.3Z"
                  fill="#f2ede4"
                />
                <path d="M22 21.5c-1.6-4.6 1.4-9.1 5.6-9.1 2.9 0 5.2 2 6 4.8l1.6 5.6" fill="#f2ede4" strokeLinecap="round" />
                <rect x="35" y="12.6" width="34.6" height="10.2" rx="5.1" fill="#f2ede4" />
                <rect x="36.5" y="26" width="19" height="7.4" rx="3.7" fill="#f2ede4" />
                <rect x="36.5" y="34.6" width="16.6" height="7.2" rx="3.6" fill="#f2ede4" />
                <rect x="35.6" y="42.8" width="12.8" height="6.2" rx="3.1" fill="#f2ede4" />
              </g>
              <path d="M57 6.4c4.4-1.4 8.4.2 10.8 3.4" fill="none" stroke="var(--signal)" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
            </svg>
          </span>

          <span
            data-bf-sting-word
            className="bf-sting-word"
            style={{ left: `${placement.wordLeft}px` } as CSSProperties}
          >
            <span aria-hidden="true" className="bf-sting-word-rule" />
            <span className="bf-sting-word-label">{label}</span>
            <span className="bf-sting-word-date">{date}</span>
          </span>
        </>
      ) : null}
    </div>
  );
}
