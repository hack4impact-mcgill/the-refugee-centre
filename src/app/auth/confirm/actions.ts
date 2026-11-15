"use server";

import { redirect } from "next/navigation";
import { emailLinkSchema } from "@/lib/schemas/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function confirmEmailLink(formData: FormData) {
  const link = emailLinkSchema.safeParse({
    token_hash: formData.get("token_hash"),
    type: formData.get("type"),
  });
  if (!link.success) redirect("/login?authError=1");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp(link.data);

  if (error) redirect("/login?authError=1");
  redirect("/shifts");
}
