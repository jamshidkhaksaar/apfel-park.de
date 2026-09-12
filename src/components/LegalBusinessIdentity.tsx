import { businessIdentity, legalIdentityText } from '@/lib/business-identity';
import { getDictionary, type Locale } from '@/lib/i18n';

/** Legal party only; customer-facing brand headings remain unchanged. */
export default function LegalBusinessIdentity({ lang }: { lang: Locale }) {
  const copy = getDictionary(lang).business;
  return (
    <div data-business-identity className="space-y-1 text-xs leading-relaxed text-muted">
      <p>{copy.providerLabel}: {legalIdentityText(lang)}</p>
      <p>{copy.legalContact}: <a className="underline underline-offset-2" href={`tel:${businessIdentity.phones.legalBusiness.e164}`}>{businessIdentity.phones.legalBusiness[lang]}</a></p>
    </div>
  );
}
