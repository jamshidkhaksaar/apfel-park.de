import type { Locale } from "@/lib/i18n";
import type { Product } from "@/lib/products";

type ProductStatusBadgeProps = {
  condition: Product["condition"];
  lang?: Locale;
  className?: string;
};

const status = {
  new: {
    label: { de: "VERSIEGELT", en: "SEALED" },
    className: "border-sky-400/40 bg-sky-500/90 text-white shadow-sky-500/25",
    icon: <path d="m12 3 1.55 4.45L18 9l-4.45 1.55L12 15l-1.55-4.45L6 9l4.45-1.55L12 3Zm6 11 0 5m-2.5-2.5h5" />,
  },
  open_box: {
    label: { de: "UNBOXED", en: "UNBOXED" },
    className: "border-amber-300/50 bg-amber-400/95 text-black shadow-amber-500/25",
    icon: <path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7m-9 4v10" />,
  },
  used: {
    label: { de: "GEBRAUCHT", en: "USED" },
    className: "border-emerald-300/45 bg-emerald-500/90 text-white shadow-emerald-500/25",
    icon: <path d="m5 12 4 4L19 6" />,
  },
} as const;

export default function ProductStatusBadge({ condition, lang = "en", className = "" }: ProductStatusBadgeProps) {
  const item = status[condition] ?? status.new;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[0.14em] shadow-lg backdrop-blur ${item.className} ${className}`}>
      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25}>
        {item.icon}
      </svg>
      {item.label[lang === "de" ? "de" : "en"]}
    </span>
  );
}
