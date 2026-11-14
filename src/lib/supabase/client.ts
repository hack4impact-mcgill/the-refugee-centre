import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function getSupabaseClient() {
  const { url, publicKey } = getSupabaseEnv();
  return createBrowserClient(url, publicKey);
}
