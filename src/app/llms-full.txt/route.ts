import { businessIdentity } from '@/lib/business-identity';
import { renderMarkdownDocument } from '@/lib/md/document';
import { listMarkdownRoutes, renderMarkdownFor, type MarkdownRouteInfo } from '@/lib/md/registry';
import { siteInfo } from '@/lib/site';

/**
 * Every page in llms.txt, concatenated through the same renderer registry that
 * serves the individual `.md` twins, so this file cannot go stale on its own.
 *
 * Rendering it costs one read per page, so the result is memoised in the
 * process and cached at the edge rather than rebuilt per request.
 */

export const dynamic = 'force-dynamic';

const MAX_CHARS = 500_000;
const MEMO_TTL_MS = 60 * 60 * 1000;

const KIND_ORDER: Record<MarkdownRouteInfo['kind'], number> = {
  content: 0,
  collection: 1,
  catalog: 2,
  showcase: 3,
  'repair-service': 4,
  'accessory-collection': 5,
  product: 6,
  legal: 7,
};

/** Core pages first, then guides and catalogue, with the legal pages last. */
const CORE_FIRST = ['/de', '/en', '/de/about', '/en/about', '/de/faq', '/en/faq', '/de/contact', '/en/contact', '/de/repairs', '/en/repairs'];

const ordered = (routes: readonly MarkdownRouteInfo[]): MarkdownRouteInfo[] =>
  [...routes].sort((a, b) => {
    const coreDelta = CORE_FIRST.indexOf(a.path) - CORE_FIRST.indexOf(b.path);
    // indexOf returns -1 for non-core pages, which must therefore sort last
    // among their kind; both branches below keep that ordering stable.
    const aCore = CORE_FIRST.indexOf(a.path) >= 0;
    const bCore = CORE_FIRST.indexOf(b.path) >= 0;
    if (aCore && bCore) return coreDelta;
    if (aCore !== bCore) return aCore ? -1 : 1;
    const kindDelta = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    return kindDelta !== 0 ? kindDelta : a.path.localeCompare(b.path);
  });

let memo: { text: string; at: number } | null = null;

const buildFullText = async (): Promise<string> => {
  const routes = ordered(listMarkdownRoutes());
  const chunks: string[] = [
    `# ${businessIdentity.tradingName} — full content`,
    `> Every public page of ${siteInfo.url} in one fetch, rendered from the same source as the HTML pages.`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
  ];

  let total = chunks.join('\n\n').length;
  let included = 0;

  for (const route of routes) {
    const doc = await renderMarkdownFor(route.path);
    if (!doc) continue;

    const rendered = renderMarkdownDocument(doc);
    if (total + rendered.length > MAX_CHARS) {
      chunks.push(
        `---\n<!-- truncated: ${routes.length - included} further pages are listed in ${siteInfo.url}/llms.txt -->`,
      );
      console.warn('[llms-full] truncated at', MAX_CHARS, 'characters;', routes.length - included, 'pages omitted');
      break;
    }

    total += rendered.length;
    included += 1;
    chunks.push(`---\n<!-- source: ${siteInfo.url}${route.path} -->\n\n${rendered.trim()}`);
  }

  return `${chunks.join('\n\n')}\n`;
};

export async function GET(): Promise<Response> {
  const now = Date.now();
  if (!memo || now - memo.at > MEMO_TTL_MS) {
    memo = { text: await buildFullText(), at: now };
  }

  return new Response(memo.text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'noindex, follow',
      'X-Markdown-Tokens': String(Math.ceil(memo.text.length / 4)),
    },
  });
}
