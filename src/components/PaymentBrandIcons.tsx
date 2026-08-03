import { siMastercard, siStripe, siVisa } from "simple-icons";

type PaymentBrandIconsProps = {
  className?: string;
  iconClassName?: string;
};

const paymentBrands = [
  { icon: siStripe, label: "Stripe" },
  { icon: siVisa, label: "Visa" },
  { icon: siMastercard, label: "Mastercard" },
] as const;

export default function PaymentBrandIcons({
  className = "",
  iconClassName = "h-5 w-auto",
}: PaymentBrandIconsProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="Accepted payment methods" role="img">
      {paymentBrands.map(({ icon, label }) => (
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
