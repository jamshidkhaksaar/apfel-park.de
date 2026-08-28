"use client";

/**
 * The card's only control. Sits above the card-wide link, so it needs its own
 * stacking context and a 44px target — the icon form keeps the card quiet while
 * the price stays the loudest thing in the row.
 */
export default function AddToCartButton({
  onClick,
  disabled,
  added,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  added: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="relative z-20 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-strong text-foreground transition-colors hover:border-gold hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface-strong disabled:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {added ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5 13 4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M2.5 3.5h2.2l2.2 11.2h11.4l1.9-8.3H6.2" />
        </svg>
      )}
    </button>
  );
}
