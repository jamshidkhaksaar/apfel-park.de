"use client";

import { useRouter } from "next/navigation";
import { useId, useCallback, useEffect, useMemo, useRef, useState } from "react";

// Drawer and palette can overlap; release the original overflow only after both close.
const scrollLocks = new WeakMap<HTMLElement, { count: number; overflow: string }>();
export const lockAdminScroll = (): (() => void) => {
  const body = document.body;
  const lock = scrollLocks.get(body) ?? { count: 0, overflow: body.style.overflow };
  lock.count += 1;
  scrollLocks.set(body, lock);
  body.style.overflow = 'hidden';
  return () => {
    lock.count -= 1;
    if (lock.count === 0) {
      body.style.overflow = lock.overflow;
      scrollLocks.delete(body);
    }
  };
};

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
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
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
        if (open) close();
        else setOpen(true);
        return;
      }
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
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const unlockScroll = lockAdminScroll();
    dialog?.showModal();
    inputRef.current?.focus();
    return () => {
      dialog?.close();
      unlockScroll();
      if (previous?.isConnected && previous.getClientRects().length && getComputedStyle(previous).visibility !== 'hidden') previous.focus();
    };
  }, [open]);

  // Keep the highlighted row inside the scroll viewport when arrowing past it.
  useEffect(() => {
    listRef.current?.querySelectorAll("li")[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  return (
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); close(); }} onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), input'));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-transparent text-foreground z-[200] flex items-start justify-center p-4 pt-[12vh]" aria-modal="true" aria-label={isGerman ? "Schnellsuche" : "Quick search"}>
      <button type="button" className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm" onClick={close} aria-label={isGerman ? "Schließen" : "Close"} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z" />
          </svg>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
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

        <ul id={listId} aria-label={isGerman ? "Seiten" : "Pages"} ref={listRef} className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.map((item, index) => (
            <li key={`${item.path}-${index}`} id={`${listId}-${index}`} role="option" aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
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
            </li>
          ))}
        </ul>
        <p role="status" className="px-3 py-2 text-center text-sm text-muted">{results.length === 0 ? (isGerman ? "Nichts gefunden" : "No matches") : `${results.length} ${isGerman ? "Ergebnisse" : "results"}`}</p>

        <p className="border-t border-border px-4 py-2 text-[11px] text-muted">
          {isGerman ? "↑↓ wählen · ↵ öffnen · Esc schließen" : "↑↓ to select · ↵ to open · Esc to close"}
        </p>
      </div>
    </dialog>
  );
}
