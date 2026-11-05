import { NextResponse, type NextRequest } from "next/server";

import { markdownBackendPath, stripMarkdownSuffix } from '@/lib/md/accept';
import {
  appendHeaderToken,
  decideRepresentation,
  markdownAlternateLink,
  markdownTwinPath,
  notAcceptableResponse,
} from '@/lib/md/negotiation';
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
const markdownRewrite = (htmlPath: string, vary: string): NextResponse => {
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
  const response = NextResponse.rewrite(new URL(markdownBackendPath(htmlPath), internalAppUrl));
  // The same URL still serves HTML, so shared caches must key on Accept; §5
  // adds User-Agent when a bot user-agent is what selected markdown.
  response.headers.set("Vary", vary);
  return response;
};
const markdownTwins = (request: NextRequest): NextResponse | Response | null => {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const pathname = request.nextUrl.pathname;
  const stripped = stripMarkdownSuffix(pathname);

  // A `.md` URL is a markdown request whether or not a twin exists: the handler
  // answers with markdown either way, including its own 404, never with HTML.
  if (stripped !== null) return markdownRewrite(stripped, "Accept");

  // Negotiation only applies where a renderer exists, so a browser asking for
  // markdown on an unrelated page still gets that page.
  if (!hasMarkdownRoute(pathname)) return null;

  const decision = decideRepresentation({
    accept: request.headers.get("accept"),
    userAgent: request.headers.get("user-agent"),
    hasTwin: true,
  });

  // §4: neither representation is acceptable, so say so rather than picking one.
  if (decision.representation === "not-acceptable") return notAcceptableResponse();
  if (decision.representation === "markdown") return markdownRewrite(pathname, decision.vary);

  return null;
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

  // A page with a markdown twin answers in two representations on one URL, so a
  // shared cache has to key it on Accept (§3) and the HTML response has to
  // advertise the twin (§6).
  //
  // The Link below is the live advertisement in production, not only in dev:
  // Next appends its preload links as separate header lines and leaves this one
  // in place, so nginx must not add a second copy. Vary is the header Next does
  // replace on page responses, which is why nginx rewrites Vary as the single
  // last writer (see deployment/vps/nginx/apfel-park.conf). Both lines here
  // also cover `next dev` and any deployment that does not sit behind that
  // proxy.
  if (hasMarkdownRoute(pathname)) {
    appendHeaderToken(response.headers, "Vary", "Accept");
    appendHeaderToken(
      response.headers,
      "Link",
      markdownAlternateLink(redirectUrl(markdownTwinPath(pathname)).toString()),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
