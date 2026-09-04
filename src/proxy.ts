import { NextResponse, type NextRequest } from "next/server";

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
            const missingUrl = request.nextUrl.clone();
            missingUrl.pathname = `/${productPath.locale}/__missing-product`;
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

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
