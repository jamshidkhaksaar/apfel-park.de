import { markdownNotFound, markdownResponse, renderMarkdownDocument } from '@/lib/md/document';
import { markdownCacheControl } from '@/lib/md/negotiation';
import { listMarkdownRoutes, renderMarkdownFor } from '@/lib/md/registry';

/**
 * Markdown backend for the public pages.
 *
 * Three ways reach the same renderer: `<path>.md`, content negotiation on the
 * HTML path (src/proxy.ts rewrites it here) and this URL directly. It never
 * returns HTML, so a missing twin is a markdown 404 rather than a page.
 *
 * The cache policy is applied here rather than in the middleware: a
 * `Cache-Control` written on the rewrite in src/proxy.ts is discarded, because
 * this handler's own response carries that header. See `markdownCacheControl`.
 */

export const dynamic = 'force-dynamic';

const CATALOG_SEGMENT = '_catalog';
const INDEX_SEGMENT = '_index';

const htmlPathFor = (segments: readonly string[]): string => {
  if (segments.length === 0) return '/';
  if (segments[0] === INDEX_SEGMENT) return '/';
  return `/${segments.join('/')}`;
};

const catalogResponse = (): Response => {
  const routes = listMarkdownRoutes();
  const payload = {
    site: 'https://apfel-park.de',
    generated: new Date().toISOString(),
    note: 'Product pages (/de/store/<slug>.md) are not enumerated here; /de/store/catalog.md carries the current set.',
    count: routes.length,
    routes,
  };

  return new Response(`${JSON.stringify(payload, null, 2)}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
};

const handle = async (
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> => {
  const { path } = await context.params;
  const segments = (path ?? []).filter((segment) => segment.length > 0);

  if (segments[0] === CATALOG_SEGMENT) return catalogResponse();

  const htmlPath = htmlPathFor(segments);

  try {
    const doc = await renderMarkdownFor(htmlPath);
    if (!doc) {
      return markdownNotFound(
        htmlPath,
        'The path has no markdown renderer, or the page it names does not exist.',
      );
    }

    return markdownResponse(renderMarkdownDocument(doc), {
      canonicalPath: doc.canonicalPath,
      lastModified: doc.lastUpdated,
      cacheSeconds: 3600,
      cacheControl: markdownCacheControl(
        request.headers.get('accept'),
        request.headers.get('user-agent'),
      ),
    });
  } catch (error) {
    // A renderer that throws must not leak a stack trace to a crawler.
    console.error('[md] render failed', { htmlPath, error });
    return markdownNotFound(htmlPath, 'Rendering this page failed; the HTML page is unaffected.');
  }
};

export const GET = handle;

export const HEAD = async (
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> => {
  const response = await handle(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
};

export const OPTIONS = (): Response =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
