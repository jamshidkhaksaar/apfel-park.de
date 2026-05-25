import { NextRequest, NextResponse } from "next/server";

import { siteInfo } from "@/lib/site";

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const toOrigin = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const addOriginWithDomainVariant = (origins: Set<string>, value: string | null | undefined) => {
  if (!value) return;

  try {
    const url = new URL(value);
    origins.add(url.origin);

    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      origins.add(url.origin);
      return;
    }

    url.hostname = `www.${url.hostname}`;
    origins.add(url.origin);
  } catch {
    const origin = toOrigin(value);
    if (origin) origins.add(origin);
  }
};

const getAllowedOrigins = (request: NextRequest) => {
  const origins = new Set<string>();
  const configuredOrigins = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    siteInfo.url,
  ];

  configuredOrigins.forEach((value) => {
    addOriginWithDomainVariant(origins, value);
  });

  if (process.env.NODE_ENV !== "production") {
    origins.add(request.nextUrl.origin);
  }

  return origins;
};

export const isSameOriginAdminMutation = (request: NextRequest) => {
  if (!mutationMethods.has(request.method.toUpperCase())) return true;

  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase() ?? null;
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }

  const origin = toOrigin(request.headers.get("origin"));
  if (origin) return getAllowedOrigins(request).has(origin);

  return process.env.NODE_ENV !== "production" || fetchSite === "same-origin" || fetchSite === "none";
};

export const rejectCrossSiteAdminMutation = (request: NextRequest, message = "Forbidden") => {
  if (isSameOriginAdminMutation(request)) return null;
  return NextResponse.json({ error: message }, { status: 403 });
};
