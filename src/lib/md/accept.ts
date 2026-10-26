/**
 * Accept-header negotiation for the markdown twins.
 *
 * Only an explicit `text/markdown` with a strictly higher q-value than
 * `text/html` switches the response. A missing header, a wildcard and an
 * equal q-value all keep HTML, so browsers, curl and link previews are never
 * surprised by markdown.
 */

export type AcceptEntry = { type: string; quality: number };

export const parseAcceptHeader = (header: string | null): AcceptEntry[] => {
  if (!header) return [];

  return header
    .split(',')
    .map((part) => {
      const [rawType, ...params] = part.split(';');
      const type = rawType.trim().toLowerCase();
      if (!type) return null;

      let quality = 1;
      for (const param of params) {
        const [key, rawValue] = param.split('=');
        if (key?.trim().toLowerCase() !== 'q') continue;
        const parsed = Number.parseFloat((rawValue ?? '').trim());
        quality = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0;
      }

      return { type, quality };
    })
    .filter((entry): entry is AcceptEntry => entry !== null);
};

const qualityFor = (entries: readonly AcceptEntry[], type: string): number =>
  entries
    .filter((entry) => entry.type === type)
    .reduce((best, entry) => Math.max(best, entry.quality), 0);

export const prefersMarkdown = (header: string | null): boolean => {
  const entries = parseAcceptHeader(header);
  if (entries.length === 0) return false;

  const markdown = qualityFor(entries, 'text/markdown');
  const html = qualityFor(entries, 'text/html');

  // A wildcard never counts as asking for markdown, and a tie keeps HTML.
  return markdown > 0 && markdown > html;
};

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
