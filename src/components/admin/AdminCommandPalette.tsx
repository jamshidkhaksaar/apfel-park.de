"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CommandItem = {
  label: string;
  path: string;
  /** Sidebar group, shown as a muted suffix so duplicate labels stay tellable apart. */
  group: string;
  /** Extra search terms — lets "rechnung" find Orders without cluttering the label. */
  keywords?: string;
  badge?: number;
};

/**
 * Twenty sidebar links plus the pages that have no link at all (new product,
 * new estimate) is more than anyone scans. Ctrl/Cmd+K goes straight there.
 *
 * Matching is subsequence-based rather than substring: "ordr" still finds
 * Orders, and "prne" finds "Produkte · Neu".
 */
const matches = (haystack: string, needle: string): boolean => {
  if (!needle) return true;
  const target = haystack.toLowerCase();
  const query = needle.toLowerCase();
  if (target.includes(query)) return true;
  let index = 0;
  for (const char of query) {
    index = target.indexOf(char, index);
    if (index === -1) return false;
    index += 1;
  }
  return true;
};

export default function AdminCommandPalette({
  items,
  lang,
}: {
  items: CommandItem[];
  lang: "de" | "en";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isGerman = lang === "de";

  const results = useMemo(
    () => items.filter((item) => matches(`${item.label} ${item.group} ${item.keywords ?? ""}`, search)).slice(0, 12),
    [items, search],
  );

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
    setActive(0);
  }, []);

  const go = useCallback((path: string) => {
    close();
    router.push(path);
  }, [close, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
        return;
      }
      if (event.key === "Escape" && open) close();
    };
    const onOpenRequest = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("admin-command-open", onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("admin-command-open", onOpenRequest);
    };
  }, [close, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the highlighted row inside the scroll viewport when arrowing past it.
  useEffect(() => {
    listRef.current?.querySelectorAll("li")[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={isGerman ? "Schnellsuche" : "Quick search"}>
      <button type="button" className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm" onClick={close} aria-label={isGerman ? "Schließen" : "Close"} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z" />
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={(event) => { setSearch(event.target.value); setActive(0); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((previous) => (previous + 1) % Math.max(results.length, 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((previous) => (previous - 1 + results.length) % Math.max(results.length, 1));
              } else if (event.key === "Enter" && results[active]) {
                event.preventDefault();
                go(results[active].path);
              }
            }}
            placeholder={isGerman ? "Seite suchen …" : "Search pages …"}
            aria-label={isGerman ? "Seite suchen" : "Search pages"}
            className="h-14 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:block">ESC</kbd>
        </div>

        <ul ref={listRef} className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.map((item, index) => (
            <li key={item.path} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => go(item.path)}
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm transition ${
                  index === active ? "bg-gold/15 text-foreground" : "text-muted hover:bg-surface-strong"
                }`}
              >
                <span className="truncate">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="ml-2 text-xs text-muted">{item.group}</span>
                </span>
                {item.badge ? (
                  <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold tabular-nums text-black">{item.badge}</span>
                ) : null}
              </button>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">{isGerman ? "Nichts gefunden" : "No matches"}</li>
          ) : null}
        </ul>

        <p className="border-t border-border px-4 py-2 text-[11px] text-muted">
          {isGerman ? "↑↓ wählen · ↵ öffnen · Esc schließen" : "↑↓ to select · ↵ to open · Esc to close"}
        </p>
      </div>
    </div>
  );
}
