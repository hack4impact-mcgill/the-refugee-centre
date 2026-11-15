"use server";

import { redirect } from "next/navigation";
import { emailLinkSchema } from "@/lib/schemas/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConfirmState = { error: string };

// Errors are shown on this page rather than on /login, since the proxy sends
// signed-in users away from /login and the message would be lost.
export async function confirmEmailLink(
  _prevState: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const link = emailLinkSchema.safeParse({
    token_hash: formData.get("token_hash"),
    type: formData.get("type"),
  });
  if (!link.success) {
    return { error: "This link is incomplete. Request a new one." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp(link.data);

  if (error) {
    // Supabase's rate limit messages say how long to wait.
    if (error.status === 429) return { error: error.message };
    return {
      error:
        link.data.type === "invite"
          ? "This invitation has already been used or has expired. If you already accepted it, sign in with your email. Otherwise, ask an admin to send a new one."
          : "This sign-in link has already been used or has expired. Request a new one.",
    };
  }

  redirect("/shifts");
}
