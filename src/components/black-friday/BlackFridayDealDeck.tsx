"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import { blackFridayCopy } from "@/lib/black-friday";
import { discountPercentage, type CatalogCardModel } from "@/lib/catalog-card";
import { deckSlot, deckStep } from "@/lib/deal-deck";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";
import {
  conditionLabels,
  deliveryLabel,
  stockLabel,
  stockTone,
  stockToneClass,
} from "@/components/store/store-labels";

/** How long one deal stays in front before the next one is tossed onto the pile. */
const DWELL_MS = 5200;
/** Must stay in step with `bf-deal-eject` in globals.css. */
const EJECT_MS = 780;

const SLOT_TRANSFORM: Record<string, { y: string; scale: number; opacity: number }> = {
  front: { y: "0px", scale: 1, opacity: 1 },
  next: { y: "-12px", scale: 0.955, opacity: 0.92 },
  back: { y: "-24px", scale: 0.91, opacity: 0.5 },
  hidden: { y: "-26px", scale: 0.86, opacity: 0 },
};

const pad = (value: number) => String(value).padStart(2, "0");

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getReducedMotionOnServer = () => false;

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};
const getVisibility = () => document.visibilityState === "visible";
const getVisibilityOnServer = () => true;

function DealCard({
  deal,
  lang,
  isBefore,
  position,
  total,
  priority,
  interactive,
}: {
  deal: CatalogCardModel;
  lang: Locale;
  isBefore: boolean;
  position: number;
  total: number;
  priority: boolean;
  interactive: boolean;
}) {
  const copy = blackFridayCopy[lang].hero;
  const discount = discountPercentage(deal.price, deal.compareAtPrice);
  const tone = stockTone(deal.stock, deal.stock <= 0);

  return (
    <Link
      href={`/${lang}/store/${deal.slug}`}
      tabIndex={interactive ? undefined : -1}
      draggable={false}
      className="group relative block overflow-hidden rounded-2xl border border-white/15 bg-[#0b0b0e] shadow-[0_28px_60px_-32px_rgba(0,0,0,0.9)] transition-colors hover:border-[color:var(--brass)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#08080a]"
    >
      <span className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-[color:var(--brass)]">
          {isBefore ? copy.currentPick : copy.topDeal} · {pad(position)} / {pad(total)}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
          <span aria-hidden="true" className="relative flex size-1.5">
            {isBefore ? null : (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--signal)] opacity-70" />
            )}
            <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--signal)]" />
          </span>
          {isBefore ? copy.shopBadge : copy.live}
        </span>
      </span>

      <span className="relative block aspect-[16/11] w-full overflow-hidden bg-[#f2ece2]">
        <Image
          src={deal.image}
          alt={deal.title}
          fill
          priority={priority}
          sizes="(max-width: 1023px) 92vw, 560px"
          className="object-contain p-6 transition-transform duration-700 group-hover:scale-[1.03] md:p-8"
          unoptimized={shouldBypassImageOptimization(deal.image)}
        />
        {discount ? (
          <span className="absolute right-3 top-3 rounded-sm bg-[color:var(--signal)] px-2 py-1 text-xs font-black tabular-nums text-white shadow-sm">
            −{discount}%
          </span>
        ) : null}
        <span className="absolute bottom-3 left-3 rounded-full bg-[#08080a]/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
          {conditionLabels[lang][deal.condition]}
        </span>
      </span>

      <span className="block px-4 pb-4 pt-3.5 md:px-5">
        <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--brass)]">
          {deal.brand ?? (lang === "de" ? "Angebot" : "Offer")}
        </span>
        <span className="mt-1 block line-clamp-2 text-base font-semibold leading-snug text-white md:text-lg">
          {deal.title}
        </span>

        <span className="mt-3 flex items-end justify-between gap-4">
          <span className="flex items-baseline gap-2.5">
            <span className="text-2xl font-extrabold tabular-nums leading-none text-white">
              {formatPrice(lang, deal.price)}
            </span>
            {deal.compareAtPrice ? (
              <span className="text-xs font-medium tabular-nums text-white/35 line-through">
                {formatPrice(lang, deal.compareAtPrice)}
              </span>
            ) : null}
          </span>
          <span className="text-right text-[9px] uppercase tracking-[0.12em] text-white/30">{copy.priceNote}</span>
        </span>

        <span className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="min-w-0 text-[11px] leading-4">
            <span className={`block font-semibold ${stockToneClass[tone]}`}>{stockLabel(lang, deal.stock, tone)}</span>
            <span className="block text-white/35">{deliveryLabel(lang, deal.pickupStock)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-[color:var(--signal)]">
            {isBefore ? copy.viewCta : copy.detailCta}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </span>
      </span>
    </Link>
  );
}

/**
 * Physical deal stack for the campaign masthead.
 *
 * The front card is the only interactive one. Every advance throws it onto the
 * back of the pile while the next deal rises, so the hero cycles the real
 * campaign list instead of freezing three products. Auto-advance pauses on
 * hover, focus, hidden tabs and off-screen sections, and never starts for
 * visitors who asked the system for reduced motion.
 */
export default function BlackFridayDealDeck({
  deals,
  lang,
  isBefore,
  total,
}: {
  deals: CatalogCardModel[];
  lang: Locale;
  isBefore: boolean;
  total: number;
}) {
  const deckCopy = blackFridayCopy[lang].hero.deck;
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    getVisibility,
    getVisibilityOnServer,
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(0);
  const leavingTimer = useRef<number | null>(null);
  const count = deals.length;

  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (leavingTimer.current) window.clearTimeout(leavingTimer.current);
  }, []);

  const settle = useCallback(() => {
    if (leavingTimer.current) window.clearTimeout(leavingTimer.current);
    leavingTimer.current = window.setTimeout(() => {
      leavingTimer.current = null;
      setLeaving(null);
    }, EJECT_MS + 70);
  }, []);

  const go = useCallback(
    (delta: number, manual = false) => {
      if (count < 2 || leavingTimer.current !== null) return;
      const current = activeRef.current;
      const next = deckStep(current, delta, count);
      if (next === current) return;
      if (delta > 0 && !reduced) {
        setLeaving(current);
        settle();
      }
      activeRef.current = next;
      setActive(next);
      if (manual) setAnnouncement(deckCopy.position(next + 1, count));
    },
    [count, reduced, settle, deckCopy],
  );

  const goTo = useCallback(
    (index: number) => {
      if (index === activeRef.current || leavingTimer.current !== null) return;
      activeRef.current = index;
      setActive(index);
      setAnnouncement(deckCopy.position(index + 1, count));
    },
    [count, deckCopy],
  );

  const running = !reduced && !paused && !hovered && !focused && inView && pageVisible;

  useEffect(() => {
    if (!running || leaving !== null || count < 2) return;
    const timer = window.setTimeout(() => go(1), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [running, leaving, count, go, active]);

  if (count === 0) return null;

  const single = count === 1;

  return (
    <div
      data-deal-deck
      className="relative"
      data-motion={reduced ? "off" : "on"}
      data-deck-paused={!running ? "true" : undefined}
    >
      <div
        ref={stageRef}
        className="bf-deck relative"
        role="region"
        aria-roledescription={deckCopy.carousel}
        aria-label={deckCopy.region}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        {deals.map((deal, index) => {
          const slot = deckSlot(index, active, count);
          const isFront = slot === "front";
          const transform = SLOT_TRANSFORM[slot];
          const style = {
            "--bf-slot-y": transform.y,
            "--bf-slot-scale": String(transform.scale),
            "--bf-slot-opacity": String(transform.opacity),
          } as CSSProperties;
          return (
            <div
              key={deal.id}
              className="bf-deck-card"
              data-slot={slot}
              data-leaving={leaving === index ? "true" : undefined}
              data-deal-id={deal.id}
              aria-hidden={isFront ? undefined : true}
              inert={isFront ? undefined : true}
              style={style}
            >
              <DealCard
                deal={deal}
                lang={lang}
                isBefore={isBefore}
                position={index + 1}
                total={count}
                priority={index === 0}
                interactive={isFront}
              />
            </div>
          );
        })}
      </div>

      {single ? null : (
        <div className="mt-5">
          {reduced ? null : (
            <div aria-hidden="true" className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <span
                key={active}
                className="bf-deck-progress block h-full w-full origin-left bg-[color:var(--signal)]"
                style={{
                  animationDuration: `${DWELL_MS}ms`,
                  animationPlayState: running ? "running" : "paused",
                }}
              />
            </div>
          )}

          <div className={`${reduced ? "mt-0" : "mt-3"} flex flex-wrap items-center justify-between gap-x-4 gap-y-3`}>
            <div className="flex items-center gap-1" role="group" aria-label={deckCopy.positionControl}>
              {deals.map((deal, index) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={deckCopy.goTo(index + 1, count)}
                  aria-current={index === active ? "true" : undefined}
                  className="flex size-6 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span
                    aria-hidden="true"
                    className={`block rounded-full transition-all duration-300 ${
                      index === active ? "size-2 bg-[color:var(--signal)]" : "size-1.5 bg-white/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-deck-action="prev"
                onClick={() => go(-1, true)}
                aria-label={deckCopy.previous}
                className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.5 6-6 6 6 6" />
                </svg>
              </button>

              {reduced ? null : (
                <button
                  type="button"
                  data-deck-action="pause"
                  onClick={() => setPaused((value) => !value)}
                  aria-label={paused ? deckCopy.play : deckCopy.pause}
                  aria-pressed={paused}
                  className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {paused ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
                      <path d="M8 5.5v13l10-6.5-10-6.5Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
                      <rect x="7" y="5.5" width="3.4" height="13" rx="1.1" />
                      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.1" />
                    </svg>
                  )}
                </button>
              )}

              <button
                type="button"
                data-deck-action="next"
                onClick={() => go(1, true)}
                aria-label={deckCopy.next}
                className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {total > count ? (
            <Link
              href={`/${lang}/black-friday`}
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {deckCopy.all(total)}
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
