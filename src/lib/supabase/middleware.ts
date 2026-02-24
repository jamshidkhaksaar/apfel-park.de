import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin-auth";

const isMaintenanceEnabled = async (
  supabase: ReturnType<typeof createServerClient>,
): Promise<boolean> => {
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "maintenance")
    .maybeSingle();

  const value = (data?.value as { enabled?: boolean } | null) ?? null;
  return Boolean(value?.enabled);
};

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired
  // Optimization: Only call getUser on protected routes or login to avoid expensive API calls on public pages
  let user = null;
  const isProtected = request.nextUrl.pathname.startsWith("/admin");
  const isLogin = request.nextUrl.pathname === "/login";
  const isMaintenancePage = request.nextUrl.pathname === "/maintenance";
  const isApi = request.nextUrl.pathname.startsWith("/api");
  const enforceMaintenanceMode = process.env.ENABLE_MAINTENANCE_MODE === "true";

  if (isProtected || isLogin) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  }

  // Protect admin routes
  if (isProtected) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (!isAdminUser(user)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  if (enforceMaintenanceMode && !isProtected && !isLogin && !isMaintenancePage && !isApi) {
    const maintenanceEnabled = await isMaintenanceEnabled(supabase);
    if (maintenanceEnabled) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged in users away from login page
  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};
