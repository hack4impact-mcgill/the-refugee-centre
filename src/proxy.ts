import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Pages a signed-out user can visit. */
const PUBLIC_PATHS = ["/login", "/auth/callback"];

/**
 * Refreshes the Supabase session cookies on every page request, sends
 * signed-out users to /login and signed-in users away from it.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, publicKey } = getSupabaseEnv();
  const supabase = createServerClient(url, publicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Update the request so pages rendered after this see the new session,
        // and the response so the browser stores it.
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Verifies the session and refreshes it if it has expired.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (isSignedIn && pathname === "/login") {
    return redirectWithCookies("/", request, response);
  }
  if (!isSignedIn && !PUBLIC_PATHS.includes(pathname)) {
    return redirectWithCookies("/login", request, response);
  }
  return response;
}

/** Redirects while keeping any session cookies or headers set above. */
function redirectWithCookies(
  path: string,
  request: NextRequest,
  response: NextResponse,
) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const key of ["Cache-Control", "Expires", "Pragma"]) {
    const value = response.headers.get(key);
    if (value) redirect.headers.set(key, value);
  }
  return redirect;
}

export const config = {
  matcher: [
    // Everything except API routes (they check auth themselves), Next.js
    // internals and static files such as the logo.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
