import {
  siApple,
  siFairphone,
  siGoogle,
  siSamsung,
  siSony,
  siXiaomi,
} from "simple-icons";

const ICONS = {
  apple: siApple,
  samsung: siSamsung,
  google: siGoogle,
  "google-pixel": siGoogle,
  xiaomi: siXiaomi,
  fairphone: siFairphone,
  sony: siSony,
} as const;

export default function RepairBrandMark({
  icon,
  name,
  className = "",
}: {
  icon: string;
  name: string;
  className?: string;
}) {
  // Uploaded logo URL
  if (icon.startsWith("/") || icon.startsWith("http")) {
    return (
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 ${className}`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt={name} className="h-full w-full object-contain" />
      </span>
    );
  }

  const normalized = icon.toLowerCase();
  const simpleIcon = ICONS[normalized as keyof typeof ICONS];

  if (!simpleIcon) {
    return (
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-sm font-bold text-gold ${className}`}
        aria-hidden="true"
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-gold ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-full w-full fill-current">
        <path d={simpleIcon.path} />
      </svg>
    </span>
  );
}
