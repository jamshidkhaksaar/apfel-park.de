import { legalIdentityText } from '@/lib/business-identity';
import { getDictionary, type Locale } from '@/lib/i18n';

/** Legal party only; customer-facing brand headings remain unchanged. */
export default function LegalBusinessIdentity({ lang }: { lang: Locale }) {
  const copy = getDictionary(lang).business;
  return (
    <div data-business-identity className="space-y-1 text-xs leading-relaxed text-muted">
      {/* Provider identification only. The proprietor's mobile is a private
          contact and is published in the Impressum, where § 5 DDG requires
          it, not on About/Contact where it competed with the shop landline
          as an NAP signal. */}
      <p>{copy.providerLabel}: {legalIdentityText(lang)}</p>
    </div>
  );
}
