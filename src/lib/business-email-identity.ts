import { businessIdentity, legalIdentityText } from './business-identity';
import { escapeHtml } from './security';

/** Applied only to newly sent messages, never persisted historical receipts. */
export const withBusinessEmailIdentity = <T extends { text: string; html: string }>(email: T): T => {
  const lines = [
    legalIdentityText('de'),
    legalIdentityText('en'),
    `${businessIdentity.email} | ${businessIdentity.website}`,
    `Geschäftlicher Kontakt / Business contact: ${businessIdentity.phones.legalBusiness.de}`,
    `Kundenservice / Customer service / WhatsApp: ${businessIdentity.phones.customerService.en}`,
    `Ladengeschäft / Store: ${businessIdentity.phones.store.en}`,
  ];
  const footer = `<div data-business-email-identity style="margin-top:24px;padding-top:12px;border-top:1px solid #ddd;font:12px/1.5 Arial,sans-serif;color:#666">${lines.map(line => `<div>${escapeHtml(line)}</div>`).join('')}</div>`;
  if (/<div\b[^>]*\bdata-business-email-identity(?:\s|>)/i.test(email.html)) return email;
  return {
    ...email,
    text: `${email.text}\n\n---\n${lines.join('\n')}`,
    html: /<\/body>/i.test(email.html) ? email.html.replace(/<\/body>/i, `${footer}</body>`) : email.html + footer,
  };
};
