import SafeEmailLink from "@/components/SafeEmailLink";
import type { Locale } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { isValidEmail } from "@/lib/security";

type ProductGpsrContactsProps = {
  locale: Locale;
  gpsr: NonNullable<Product["gpsr"]>;
};

const obfuscateEmail = (email: string): string =>
  email.replaceAll("@", " [at] ").replaceAll(".", " [dot] ");

const GpsrPartyContact = ({
  label,
  party,
}: {
  label: string;
  party: NonNullable<NonNullable<Product["gpsr"]>["manufacturer"]>;
}) => {
  const email = party.email?.trim();
  const emailClassName = "mt-1 inline-block text-gold underline underline-offset-2";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-foreground">{party.name}</p>
      {party.address ? <p className="mt-1 whitespace-pre-line">{party.address}</p> : null}
      {email ? (
        isValidEmail(email) ? (
          <SafeEmailLink email={email} className={emailClassName} />
        ) : (
          <span className={emailClassName}>{obfuscateEmail(email)}</span>
        )
      ) : null}
    </div>
  );
};

export default function ProductGpsrContacts({ locale, gpsr }: ProductGpsrContactsProps) {
  return (
    <>
      {gpsr.manufacturer ? (
        <GpsrPartyContact
          label={locale === "de" ? "Hersteller" : "Manufacturer"}
          party={gpsr.manufacturer}
        />
      ) : null}
      {gpsr.euResponsible ? (
        <GpsrPartyContact
          label={locale === "de" ? "Verantwortliche Person in der EU" : "Responsible person in the EU"}
          party={gpsr.euResponsible}
        />
      ) : null}
    </>
  );
}
