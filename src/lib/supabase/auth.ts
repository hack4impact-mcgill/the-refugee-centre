import { getSupabaseClient } from "@/lib/supabase/client";

export async function sendMagicLink(email: string, redirectTo: string) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      // Accounts are only created by invitation.
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
