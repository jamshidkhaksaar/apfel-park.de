import { blocks, escapeMarkdown, heading, list, markdownLink, table } from './format';

/**
 * Renders the page copy objects from src/lib/content.ts as markdown.
 *
 * The store keeps its page copy in nested objects (and allows database
 * overrides of the same shape), so a shape-by-shape renderer per page would
 * drift from the HTML the moment the owner edits copy. Walking the same object
 * the page renders keeps the two in step. Headings come from the copy itself
 * (`symptomsTitle` next to `symptoms`), never from the camelCase key name.
 */

/** Keys that describe chrome, tracking or UI state rather than page content. */
const CHROME_KEYS = new Set([
  'nav',
  'header',
  'footer',
  'meta',
  'eyebrow',
  'badge',
  'cta',
  'ctas',
  'buttons',
  'labels',
  'label',
  'placeholder',
  'alt',
  'aria',
  'icon',
  'icons',
  'image',
  'images',
  'href',
  'slug',
  'path',
  'theme',
  'stats',
  'social',
  'whatsapp',
  'priceFrom',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string');

const looksLikeUiValue = (value: string): boolean =>
  value.trim().length === 0 || /^(https?:)?\/\//.test(value) || value.startsWith('/');

const renderStringArray = (items: readonly string[]): string => list(items);

const renderObjects = (items: readonly unknown[]): string => {
  const records = items.filter(isRecord);
  if (records.length !== items.length || records.length === 0) return '';

  // FAQ-shaped copy: the question is the heading the page shows.
  const faq = records.filter((entry) => typeof entry.question === 'string' && typeof entry.answer === 'string');
  if (faq.length === records.length) {
    return blocks(
      ...faq.map((entry) =>
        blocks(heading(3, entry.question as string), escapeMarkdown(entry.answer as string)),
      ),
    );
  }

  // Card-shaped copy: { title, text } or { title, body }.
  const cards = records.filter(
    (entry) =>
      typeof entry.title === 'string' &&
      (typeof entry.text === 'string' || typeof entry.body === 'string'),
  );
  if (cards.length === records.length) {
    return blocks(
      ...cards.map((entry) =>
        blocks(
          heading(3, entry.title as string),
          escapeMarkdown((entry.text ?? entry.body) as string),
        ),
      ),
    );
  }

  // Citation-shaped copy: { label, href }.
  const citations = records.filter(
    (entry) => typeof entry.label === 'string' && typeof entry.href === 'string',
  );
  if (citations.length === records.length) {
    return list(citations.map((entry) => markdownLink(entry.label as string, entry.href as string)));
  }

  // Spec-shaped copy: { label, value } becomes a two-column table.
  const specs = records.filter(
    (entry) => typeof entry.label === 'string' && typeof entry.value === 'string',
  );
  if (specs.length === records.length) {
    return table(
      ['Merkmal', 'Wert'],
      specs.map((entry) => [entry.label as string, entry.value as string]),
    );
  }

  return blocks(
    ...records.map((entry) => {
      const title = typeof entry.title === 'string' ? entry.title : undefined;
      const body = renderValue(entry);
      return title ? blocks(heading(3, title), body) : body;
    }),
  );
};

const renderValue = (value: unknown): string => {
  if (typeof value === 'string') return escapeMarkdown(value);
  if (typeof value === 'number' || typeof value === 'boolean') return '';
  if (isStringArray(value)) return renderStringArray(value);
  if (Array.isArray(value)) return renderObjects(value);
  if (isRecord(value)) return walk(value);
  return '';
};

const walk = (source: Record<string, unknown>): string => {
  const parts: string[] = [];
  const consumed = new Set<string>();

  for (const [key, value] of Object.entries(source)) {
    if (CHROME_KEYS.has(key)) continue;
    // Only strings can be UI chrome; arrays and nested objects always carry
    // copy and must be walked, not skipped.
    if (typeof value === 'string' && looksLikeUiValue(value)) continue;

    // <name>Title labels the sibling array (<name>), which the page shows as a
    // heading above that list, so reuse the same words instead of the key.
    if (key.endsWith('Title') && typeof value === 'string' && !looksLikeUiValue(value)) {
      const bodyKey = key.slice(0, -'Title'.length);
      if (bodyKey in source) {
        consumed.add(bodyKey);
        parts.push(blocks(heading(3, value), renderValue(source[bodyKey])));
        continue;
      }
      parts.push(heading(2, value));
      continue;
    }

    if (consumed.has(key)) continue;
    parts.push(renderValue(value));
  }

  return blocks(...parts);
};

/**
 * Renders a page copy object. `exclude` lists keys already consumed by the
 * caller (for example the headline and subtitle that became the document
 * title and summary).
 */
export const contentToMarkdown = (
  source: unknown,
  exclude: readonly string[] = ['title', 'heroTitle', 'subtitle', 'heroSubtitle'],
): string => {
  if (!isRecord(source)) return typeof source === 'string' ? escapeMarkdown(source) : '';

  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (exclude.includes(key)) continue;
    filtered[key] = value;
  }

  return walk(filtered);
};

/** First non-empty string for any of the given keys, for titles and summaries. */
export const firstString = (
  source: unknown,
  keys: readonly string[],
): string | undefined => {
  if (!isRecord(source)) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return undefined;
};
