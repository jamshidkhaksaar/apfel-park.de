"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import type { ProductCategory, ProductCondition } from "@/lib/products";
import { shouldBypassImageOptimization } from "@/lib/image";

type Suggestion = {
  id: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  category: ProductCategory;
  condition: ProductCondition;
  brand?: string;
  stock: number;
};

export default function StoreCatalogSearch({
  lang,
  initialQuery = "",
  resultCount,
  className = "",
}: {
  lang: Locale;
  initialQuery?: string;
  resultCount?: number;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const isGerman = lang === "de";

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/store/search?lang=${lang}&q=${encodeURIComponent(term)}&limit=8`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search_failed");
        const payload = await response.json() as { items?: Suggestion[] };
        setSuggestions(Array.isArray(payload.items) ? payload.items : []);
        setActiveIndex(-1);
        setOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [lang, query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim().slice(0, 80);
    const next = new URLSearchParams(searchParams.toString());
    if (term) next.set("q", term); else next.delete("q");
    next.delete("page");
    setOpen(false);
    window.apfelTrack?.("search", {
      search_term: term,
      results_count: term === initialQuery ? resultCount : undefined,
    });
    router.push(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => index <= 0 ? suggestions.length - 1 : index - 1);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      router.push(`/${lang}/store/${suggestions[activeIndex].slug}`);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form ref={formRef} onSubmit={submit} role="search" className="relative">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          role="combobox"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={isGerman ? "Produkt suchen …" : "Search products …"}
          aria-label={isGerman ? "Produkte durchsuchen" : "Search products"}
          aria-autocomplete="list"
          aria-controls={open && suggestions.length > 0 ? listboxId : undefined}
          aria-expanded={open && suggestions.length > 0}
          aria-activedescendant={open && suggestions.length > 0 && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          maxLength={80}
          className="h-13 w-full rounded-2xl border border-border/80 bg-background/90 py-3 pl-12 pr-16 text-base text-foreground shadow-sm outline-none transition placeholder:text-muted focus:border-gold/60 focus:ring-4 focus:ring-gold/10 sm:pr-28"
        />
        <button type="submit" className="absolute right-1 top-1 min-h-11 min-w-11 rounded-xl bg-foreground px-3 text-sm font-bold text-background transition hover:bg-gold hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:px-5">
          <span className="sm:hidden">{isGerman ? "Los" : "Go"}</span>
          <span className="hidden sm:inline">{isGerman ? "Suchen" : "Search"}</span>
        </button>
      </form>

      {open && query.trim().length >= 2 ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border bg-background p-2 shadow-2xl shadow-black/20">
          {loading ? (
            <p className="px-4 py-5 text-sm text-muted" role="status">{isGerman ? "Produkte werden gesucht …" : "Searching products …"}</p>
          ) : suggestions.length > 0 ? (
            <>
              <div id={listboxId} role="listbox">
                {suggestions.map((item, index) => (
                  <Link
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    key={item.id}
                    href={`/${lang}/store/${item.slug}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-16 items-center gap-3 rounded-xl px-3 py-2 transition ${index === activeIndex ? "bg-gold/10" : "hover:bg-surface"}`}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                      <Image src={item.image} alt={item.title} fill sizes="48px" className="object-contain p-1" unoptimized={shouldBypassImageOptimization(item.image)} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-muted">{item.stock > 0 ? (isGerman ? "Sofort verfügbar" : "In stock") : (isGerman ? "Ausverkauft" : "Out of stock")}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-foreground">{formatPrice(lang, item.price)}</span>
                  </Link>
                ))}
              </div>
              <button type="button" onClick={() => formRef.current?.requestSubmit()} className="mt-1 min-h-11 w-full rounded-xl px-4 text-left text-sm font-semibold text-gold hover:bg-gold/10">
                {isGerman ? `Alle Ergebnisse für „${query.trim()}“` : `All results for “${query.trim()}”`}
              </button>
            </>
          ) : (
            <p className="px-4 py-5 text-sm text-muted" role="status">{isGerman ? "Keine passenden Produkte gefunden." : "No matching products found."}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
