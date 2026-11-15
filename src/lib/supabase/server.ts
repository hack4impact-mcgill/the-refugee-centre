import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publicKey } = getSupabaseEnv();

  return createServerClient(url, publicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // The `setAll` method can throw if called during a server action or route handler.
          // Ignore errors here since they are usually harmless and the request will continue.
        }
      },
    },
  });
}

export async function isSignedIn() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}

// Passed as the redirect URL when sending an email, so its link opens the
// server that sent it. Supabase only allows origins listed in the project's
// Redirect URLs, and otherwise falls back to the Site URL.
export async function getRequestOrigin() {
  return (await headers()).get("origin") ?? undefined;
}

export function unauthorized() {
  return Response.json({ error: "Not signed in" }, { status: 401 });
}
