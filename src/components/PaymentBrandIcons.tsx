import { siMastercard, siPaypal, siStripe, siVisa } from "simple-icons";

type PaymentBrandIconsProps = {
  className?: string;
  iconClassName?: string;
  /** Drop the PayPal mark where PayPal is not actually available. */
  includePayPal?: boolean;
};

const paymentBrands = [
  { icon: siStripe, label: "Stripe" },
  { icon: siVisa, label: "Visa" },
  { icon: siMastercard, label: "Mastercard" },
  { icon: siPaypal, label: "PayPal" },
] as const;

export default function PaymentBrandIcons({
  className = "",
  iconClassName = "h-5 w-auto",
  includePayPal = true,
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
