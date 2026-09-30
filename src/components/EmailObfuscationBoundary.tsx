import type { ReactNode } from 'react';

/** Cloudflare's documented, markup-local email exemption. Both comments
 * surround the complete anchor/text so the edge cannot rewrite its href.
 * Fixed comment HTML only: all content still receives React escaping.
 * https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/
 */
export default function EmailObfuscationBoundary({ children }: { children: ReactNode }) {
  return (
    <span className="contents">
      <span hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: '<!--email_off-->' }} />
      {children}
      <span hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: '<!--/email_off-->' }} />
    </span>
  );
}
