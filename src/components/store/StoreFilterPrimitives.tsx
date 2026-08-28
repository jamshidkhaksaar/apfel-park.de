"use client";

import { useState, type ReactNode } from "react";

import type { FacetOption } from "../../lib/products";

export function FilterSection({
  title,
  count,
  active = false,
  activeLabel = "Active",
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  active?: boolean;
  activeLabel?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-border/60 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {title}
          {active ? (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
              {activeLabel}
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          {count !== undefined ? <span className="text-xs text-muted">{count}</span> : null}
          <svg
            className={`h-4 w-4 text-muted transition-transform duration-200 group-hover:text-foreground ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open ? <div className="mt-3 space-y-2">{children}</div> : null}
    </section>
  );
}

export function Checklist({
  options,
  active,
  renderLabel,
  onToggle,
  normalizeValue = (value) => value,
  initialVisible = 8,
  showMoreLabel,
  showLessLabel,
}: {
  options: FacetOption[];
  active: Set<string>;
  renderLabel: (value: string) => string;
  onToggle: (value: string) => void;
  normalizeValue?: (value: string) => string;
  initialVisible?: number;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, initialVisible);

  return (
    <>
      {visible.map((option) => {
        const checked = active.has(normalizeValue(option.value));

        return (
          <label
            key={option.value}
            className={`group flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
              checked
                ? "border-gold/35 bg-gold/10"
                : "border-transparent hover:border-border/70 hover:bg-surface-strong/50"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option.value)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface ${
                checked
                  ? "border-gold bg-gold text-black shadow-[0_0_0_3px_var(--gold-pulse)]"
                  : "border-border bg-background/50 text-transparent group-hover:border-gold/60"
              }`}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-3.5 w-3.5"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 10.5 3.25 3.25 7.75-8" />
              </svg>
            </span>
            <span className={`flex-1 truncate text-sm ${checked ? "font-semibold text-foreground" : "text-muted"}`}>
              {renderLabel(option.value)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${checked ? "bg-gold/15 text-gold" : "bg-surface-strong/60 text-muted"}`}>
              {option.count}
            </span>
          </label>
        );
      })}
      {options.length > initialVisible ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="min-h-11 rounded-lg px-3 text-xs font-semibold text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
        >
          {expanded ? showLessLabel : `${showMoreLabel} (${options.length - initialVisible})`}
        </button>
      ) : null}
    </>
  );
}
