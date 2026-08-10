import { siApplepay, siKlarna, siMastercard, siPaypal, siStripe, siVisa } from "simple-icons";

type PaymentBrandIconsProps = {
  className?: string;
  iconClassName?: string;
  /**
   * PayPal is off by default because the shop cannot take it: it is disabled on
   * the Stripe account and there are no PayPal SDK credentials. Showing a mark
   * for a method that does not work is what Google calls misrepresentation, and
   * it blocked the whole catalogue in Germany. Pass true only where PayPal has
   * been confirmed available, as the checkout does.
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
  { icon: siKlarna, label: "Klarna" },
  { icon: siPaypal, label: "PayPal" },
] as const;

export default function PaymentBrandIcons({
  className = "",
  iconClassName = "h-5 w-auto",
  includePayPal = false,
}: PaymentBrandIconsProps) {
  const brands = includePayPal
    ? paymentBrands
    : paymentBrands.filter((brand) => brand.label !== "PayPal");

  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="Accepted payment methods" role="img">
      {brands.map(({ icon, label }) => (
        <svg
          key={icon.slug}
          aria-label={label}
          className={iconClassName}
          fill={`#${icon.hex}`}
          role="img"
          viewBox="0 0 24 24"
        >
          <path d={icon.path} />
        </svg>
      ))}
    </div>
  );
}
