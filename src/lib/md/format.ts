import { siteInfo } from '@/lib/site';

/**
 * Markdown primitives shared by every renderer under src/lib/md.
 *
 * Two rules hold throughout this folder: URLs are absolute, because an agent
 * fetches a single file with no page context, and internal links point at the
 * HTML page rather than its markdown twin, so the HTML page stays canonical.
 */

/** Escapes the characters that would otherwise open markdown or HTML markup. */
export const escapeMarkdown = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/[`[\]<>]/g, '\\$&')
    .replace(/\s+/g, ' ')
    .trim();

/** Table cells are the one place a bare pipe still breaks the layout. */
const tableCell = (value: string): string => escapeMarkdown(value).replace(/\|/g, '\\|');

export const absoluteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized === '/' ? `${siteInfo.url}/` : `${siteInfo.url}${normalized}`;
};

export const markdownLink = (label: string, path: string): string =>
  `[${escapeMarkdown(label)}](${absoluteUrl(path)})`;

export const heading = (level: 1 | 2 | 3 | 4, text: string): string =>
  `${'#'.repeat(level)} ${escapeMarkdown(text)}`;

export const list = (items: readonly string[]): string =>
  items
    .filter((item) => item.trim().length > 0)
    .map((item) => `- ${escapeMarkdown(item)}`)
    .join('\n');

export const numberedList = (items: readonly string[]): string =>
  items
    .filter((item) => item.trim().length > 0)
    .map((item, index) => `${index + 1}. ${escapeMarkdown(item)}`)
    .join('\n');

export const table = (headers: readonly string[], rows: readonly (readonly string[])[]): string => {
  const head = `| ${headers.map(tableCell).join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${headers.map((_, index) => tableCell(row[index] ?? '')).join(' | ')} |`);
  return [head, divider, ...body].join('\n');
};

/** Joins the blocks that exist, so callers can build a document conditionally. */
export const blocks = (...parts: Array<string | null | undefined | false>): string =>
  parts
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join('\n\n');

export const section = (title: string, body: string): string => blocks(heading(2, title), body);

/** ISO date (with or without time) reduced to the YYYY-MM-DD agents expect. */
export const isoDate = (value?: string | Date | null): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

/** Rough token estimate for X-Markdown-Tokens; characters/4 is the usual rule. */
export const approximateTokens = (markdown: string): number => Math.ceil(markdown.length / 4);
