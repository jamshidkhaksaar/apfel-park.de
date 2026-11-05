/**
 * Path helpers for the markdown twins.
 *
 * The negotiation decision itself lives in ./negotiation.ts, which implements
 * the AEO Specification (v1.0) through @dualmark/core instead of a local
 * parser: wildcards, q-value ordering, the 406 case and the bot-user-agent rule
 * all have to agree with the reference implementation the conformance runner
 * tests against.
 */

/** `/de/faq.md` -> `/de/faq`, `/index.md` -> `/`; null when there is no suffix. */
export const stripMarkdownSuffix = (pathname: string): string | null => {
  if (!pathname.toLowerCase().endsWith('.md')) return null;
  const withoutSuffix = pathname.slice(0, -'.md'.length);
  if (withoutSuffix === '' || withoutSuffix === '/index') return '/';
  return withoutSuffix.endsWith('/') ? withoutSuffix.slice(0, -1) : withoutSuffix;
};

/** Path served by the markdown route handler for a public HTML path. */
export const markdownBackendPath = (htmlPath: string): string =>
  htmlPath === '/' || htmlPath === '' ? '/api/md/_index' : `/api/md${htmlPath}`;
