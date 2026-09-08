import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Fast "is anyone logged in" gate for /reception, /doctor, /admin and /store.
// This is defense in depth only -- the real role check happens again in
// each route's layout and inside every Server Action, since a proxy
// matcher can miss some request types (see the Next.js proxy docs).
const GATED_PREFIXES = ["/reception", "/doctor", "/admin", "/store"];

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isGate = GATED_PREFIXES.some((p) => pathname.startsWith(p));
  const isLogin = pathname === "/staff/login";
  if (!isGate || isLogin) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/staff/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/reception/:path*", "/doctor/:path*", "/admin/:path*", "/store/:path*"],
};
