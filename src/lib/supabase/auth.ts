import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Emails a sign-in link to an existing account. It never creates an account:
 * admins are only added from the Supabase dashboard or the /admins page.
 */
export async function sendMagicLink(email: string, redirectTo: string) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: false,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
