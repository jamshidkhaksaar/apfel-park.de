import { siApplepay, siGooglepay, siKlarna, siMastercard, siPaypal, siStripe, siVisa } from "simple-icons";

const iconsByLabel = {
  "Apple Pay": siApplepay,
  "Google Pay": siGooglepay,
  PayPal: siPaypal,
} as const;

export type PaymentBrandLabel = keyof typeof iconsByLabel;

export function PaymentBrandMark({
  label,
  className = "h-5 w-auto",
}: {
  label: PaymentBrandLabel;
  className?: string;
}) {
  const icon = iconsByLabel[label];

  return (
    <svg
      aria-label={label}
      className={className}
      fill={`#${icon.hex}`}
      role="img"
      viewBox="0 0 24 24"
    >
      <path d={icon.path} />
    </svg>
  );
}

type PaymentBrandIconsProps = {
  className?: string;
  iconClassName?: string;
  showLabels?: boolean;
  /**
   * PayPal stays opt-in so generic trust rows never claim a payment method that
   * is unavailable. The checkout enables it only when live credentials exist.
   */
  includePayPal?: boolean;
};

// Verified against the live Stripe account (DE, charges enabled): card, Apple
// Pay and Klarna are on. Giropay shut down at the end of 2024 and Sofort was
// retired by Stripe, so neither is claimed anywhere any more.
const paymentBrands = [
  { icon: siStripe, label: "Stripe" },
  { icon: siVisa, label: "Visa" },
  { icon: siMastercard, label: "Mastercard" },
  { icon: siApplepay, label: "Apple Pay" },
  { icon: siGooglepay, label: "Google Pay" },
  { icon: siKlarna, label: "Klarna" },
  { icon: siPaypal, label: "PayPal" },
] as const;

export default function PaymentBrandIcons({
  className = "",
  iconClassName = "h-5 w-auto",
  includePayPal = false,
  showLabels = false,
}: PaymentBrandIconsProps) {
  const brands = includePayPal
    ? paymentBrands
    : paymentBrands.filter((brand) => brand.label !== "PayPal");

  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="Accepted payment methods" role="group">
      {brands.map(({ icon, label }) => (
        <span
          key={icon.slug}
          className={showLabels ? "inline-flex min-h-7 items-center gap-1.5 rounded-md border border-border/70 bg-surface px-2 py-1" : "inline-flex items-center"}
        >
          <svg
            aria-hidden={showLabels || undefined}
            aria-label={showLabels ? undefined : label}
            className={showLabels ? "h-4 w-4 shrink-0" : iconClassName}
            fill={`#${icon.hex}`}
            role={showLabels ? undefined : "img"}
            viewBox="0 0 24 24"
          >
            <path d={icon.path} />
          </svg>
          {showLabels ? <span className="whitespace-nowrap text-[10px] font-semibold text-foreground/80">{label}</span> : null}
        </span>
      ))}
    </div>
  );
}
