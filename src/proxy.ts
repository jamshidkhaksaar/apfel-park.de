import { NextResponse, type NextRequest } from "next/server";

import { markdownBackendPath, prefersMarkdown, stripMarkdownSuffix } from '@/lib/md/accept';
import { hasMarkdownRoute } from '@/lib/md/routes';
import { internalMissingProductUrl } from '@/lib/product-route-resolution';

const isPublicStorePath = (pathname: string) => {
  // Only the generic /store aggregator obeys the store-maintenance toggle.
  // Category pages (/smartphones, /accessories, …) and the Open-Box catalog
  // (/open-box) stay reachable, consistent with the other nav category links.
  return /^\/(?:de|en)\/store(?:\/.*)?$/.test(pathname);
};

const publicProductPath = (pathname: string) => {
  const match = pathname.match(/^\/(de|en)\/store\/([^/]+)$/);
  if (!match || match[2] === 'catalog') return null;
  return { locale: match[1], slug: match[2] };
};

const isBypassedPath = (pathname: string) => {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname === "/login" ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images")
  );
};

const redirectUrl = (path: string) => {
  try {
    return new URL(path, process.env.SITE_URL || "https://apfel-park.de");
  } catch {
    return new URL(path, "https://apfel-park.de");
  }
};

const createPublicRedirect = (scope: "site" | "store") =>
  NextResponse.redirect(redirectUrl(`/maintenance?scope=${scope}`));

/**
 * Markdown twins.
 *
 * `/de/faq.md` and `Accept: text/markdown` on `/de/faq` both reach the markdown
 * handler at /api/md, which never returns HTML. A `.md` path with no twin is
 * left to the handler so it can answer with a markdown 404, while negotiation
 * only takes over URLs that actually have a twin, so a browser asking for
 * markdown on an unrelated page still gets its HTML.
 */
const markdownTwins = (request: NextRequest): NextResponse | null => {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const pathname = request.nextUrl.pathname;
  const stripped = stripMarkdownSuffix(pathname);
  if (stripped === null && !prefersMarkdown(request.headers.get("accept"))) return null;

  const htmlPath = stripped ?? pathname;
  if (stripped === null && !hasMarkdownRoute(htmlPath)) return null;

  // The destination has to name this app at the address Next itself serves,
  // which is not the public one: behind the TLS-terminating proxy the request
  // looks like https://apfel-park.de/<path>.md while Next resolves a middleware
  // rewrite against its own origin (https://localhost:3000 with
  // x-forwarded-proto=https). A destination on any other origin is therefore an
  // external hop that Next fetches with https against a plain-HTTP server,
  // which fails with EPROTO and turns every markdown twin into a 500. Router
  // rewrites reject relative URLs, so the internal address is the only target
  // that works in both dev and production. INTERNAL_APP_URL is the same knob
  // the maintenance and product-route calls below already use.
  const internalAppUrl = process.env.INTERNAL_APP_URL ?? "http://127.0.0.1:3000";
  const response = NextResponse.rewrite(
    new URL(markdownBackendPath(htmlPath), internalAppUrl),
  );
  // The same URL still serves HTML, so shared caches must key on Accept.
  response.headers.set("Vary", "Accept");
  return response;
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-apfel-pathname", pathname);

  if (request.nextUrl.pathname.startsWith("/admin/content")) {
    return NextResponse.redirect(redirectUrl("/admin"));
  }

  if (!isBypassedPath(pathname)) {
    try {
      const internalAppUrl = process.env.INTERNAL_APP_URL ?? "http://127.0.0.1:3000";
      const maintenanceUrl = new URL("/api/public/maintenance", internalAppUrl);
      const response = await fetch(maintenanceUrl, {
        headers: {
          "x-maintenance-probe": "1",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const maintenance = (await response.json()) as {
          siteEnabled?: boolean;
          storeEnabled?: boolean;
        };

        if (maintenance.siteEnabled) {
          return createPublicRedirect("site");
        }

        if (maintenance.storeEnabled && isPublicStorePath(pathname)) {
          return createPublicRedirect("store");
        }
      }
    } catch {
      // Fail open if maintenance settings cannot be read.
    }

    const markdown = markdownTwins(request);
    if (markdown) return markdown;

    const productPath = publicProductPath(pathname);
    if (productPath) {
      try {
        const internalAppUrl = process.env.INTERNAL_APP_URL ?? 'http://127.0.0.1:3000';
        const routeUrl = new URL(
          `/api/public/product-route/${encodeURIComponent(productPath.slug)}`,
          internalAppUrl,
        );
        const response = await fetch(routeUrl, { cache: 'no-store' });
        if (response.ok) {
          const resolution = (await response.json()) as {
            kind?: 'active' | 'redirect' | 'missing';
            slug?: string;
          };
          if (resolution.kind === 'redirect' && resolution.slug) {
            return NextResponse.redirect(
              redirectUrl(`/${productPath.locale}/store/${resolution.slug}`),
              301,
            );
          }
          if (resolution.kind === 'missing') {
            const missingUrl = internalMissingProductUrl(internalAppUrl, productPath.locale);
            const missing = NextResponse.rewrite(missingUrl, { status: 404 });
            missing.headers.set('X-Robots-Tag', 'noindex');
            return missing;
          }
        }
      } catch {
        // Fail open on resolver errors so a database issue cannot hide products.
      }
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Pages with a markdown twin answer in two representations on one URL, so a
  // shared cache has to key them on Accept. Next adds its own vary tokens for
  // RSC requests; this line is appended, never overwriting them.
  if (hasMarkdownRoute(pathname)) response.headers.append("Vary", "Accept");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
