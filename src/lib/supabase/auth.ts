import { getSupabaseClient } from "@/lib/supabase/client";

export async function signOut() {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
