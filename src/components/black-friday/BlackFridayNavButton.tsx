import Link from "next/link";

/**
 * The Black Friday entry beside the logo, on every screen size. One component
 * replaces the old utility-bar link, tablet pill and desktop nav pill.
 *
 * Loops (CSS only, off under prefers-reduced-motion): the gold rim travels,
 * a red glow breathes underneath, and the price tag swings.
 */
export default function BlackFridayNavButton({
  href,
  label,
  marker,
  ariaLabel,
  active = false,
}: {
  href: string;
  /** "Black Friday" */
  label: string;
  /** Live: "−30%" (the real maximum saving). Teaser: the start date. */
  marker: string | null;
  ariaLabel: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      data-campaign-target="nav"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className="bf-nav-btn group inline-flex h-10 shrink-0 items-center gap-1 rounded-full pl-1 pr-1.5 text-white transition-transform active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bf-gold-2)] sm:h-11 sm:gap-2 sm:pl-2 sm:pr-2"
    >
      <span aria-hidden="true" className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[color:var(--bf-red)] shadow-[0_0_14px_rgba(232,23,44,0.6)] sm:size-8">
        <svg viewBox="0 0 24 24" className="bf-nav-tag size-4 sm:size-[18px]" fill="none">
          <path
            d="M3.2 11.4 10.6 3.9a1.8 1.8 0 0 1 1.3-.5l4.9.2a1.8 1.8 0 0 1 1.7 1.7l.2 4.9a1.8 1.8 0 0 1-.5 1.3l-7.5 7.4a1.8 1.8 0 0 1-2.6 0l-4.9-4.9a1.8 1.8 0 0 1 0-2.6Z"
            fill="#fff"
          />
          <circle cx="16.3" cy="7.7" r="1.55" fill="var(--bf-red)" />
          <path d="M8 15.8 13.6 10.2" stroke="var(--bf-red)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8.6" cy="11" r="1.05" fill="var(--bf-red)" />
          <circle cx="12.9" cy="15.1" r="1.05" fill="var(--bf-red)" />
        </svg>
      </span>
      {/* sm+: BLACK / FRIDAY stack plus a red marker pill. Phones with a
          marker: BLACK FRIDAY over the marker, so the header keeps one row
          at 360 px. */}
      <span aria-hidden="true" className={`${marker ? "hidden sm:flex" : "flex"} flex-col leading-none`}>
        <span className="bf-gold-text text-[9px] font-black uppercase tracking-[0.16em] sm:text-[10px]">
          {label.split(" ")[0]}
        </span>
        <span className="mt-0.5 text-[11px] font-black uppercase tracking-[0.06em] text-white sm:text-xs">
          {label.split(" ").slice(1).join(" ")}
        </span>
      </span>
      {marker ? (
        <>
          <span aria-hidden="true" className="flex flex-col pr-0.5 leading-none sm:hidden">
            <span className="bf-gold-text whitespace-nowrap text-[8px] font-black uppercase tracking-[0.04em] min-[380px]:tracking-[0.12em]">{label}</span>
            <span className="mt-0.5 text-sm font-black tabular-nums text-white">{marker}</span>
          </span>
          <span
            aria-hidden="true"
            className="bf-shine relative hidden overflow-hidden rounded-full bg-[color:var(--bf-red)] px-2 py-1 text-xs font-black tabular-nums leading-none text-white sm:inline-block"
          >
            {marker}
          </span>
        </>
      ) : null}
    </Link>
  );
}
