import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { claimsAreAdmin } from "@/lib/auth";
import type { Database } from "@/types/database";

/**
 * Admin-only areas. Add an entry here and in the matcher in src/proxy.ts —
 * the gate itself never needs another branch.
 */
const PROTECTED_AREAS = [
  { base: "/studio", login: "/studio/login" },
  { base: "/cms", login: "/cms/login" },
  { base: "/shop", login: "/shop/login" },
] as const;

function areaFor(pathname: string) {
  return PROTECTED_AREAS.find(
    (area) => pathname === area.base || pathname.startsWith(`${area.base}/`),
  );
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const { pathname } = request.nextUrl;

  // App Router paths are case sensitive, so /CMS would 404. Send it to the
  // canonical lowercase route. Doing it here rather than in next.config.ts
  // matters: redirect `source` matching is case INSENSITIVE, so a "/CMS" rule
  // there also catches "/cms" and loops forever.
  const lowercased = pathname.toLowerCase();
  if (pathname !== lowercased && areaFor(lowercased)) {
    const canonical = request.nextUrl.clone();
    canonical.pathname = lowercased;
    return NextResponse.redirect(canonical);
  }

  const area = areaFor(pathname);
  const isLoginRoute = area?.login === pathname;

  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headersToSet).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const admin = claimsAreAdmin(claims);

  if (area && !isLoginRoute && !admin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = area.login;
    redirectUrl.searchParams.set("reason", claims ? "access" : "login");
    return NextResponse.redirect(redirectUrl);
  }

  if (area && isLoginRoute && admin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = area.base;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
