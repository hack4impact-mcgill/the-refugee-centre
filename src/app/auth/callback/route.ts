import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// Only links from Supabase's default {{ .ConfirmationURL }} Magic Link
// template land here. Delete this route (and its entry in PUBLIC_PATHS in
// src/proxy.ts) once the template links to /auth/confirm and older links have
// expired. See "Email sign-in" in the README.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?authError=1", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?authError=1", request.url));
  }

  return NextResponse.redirect(new URL("/shifts", request.url));
}
