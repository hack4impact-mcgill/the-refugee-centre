"use server";

import { z } from "zod";
import { isAuthError } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSignedIn } from "@/lib/supabase/server";

export type InviteAdminState = {
  status: "idle" | "success" | "error";
  message: string;
  email: string;
};

const schema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
});

// Every account is an admin, so any signed-in user can invite another.
export async function inviteAdmin(
  _prevState: InviteAdminState,
  formData: FormData,
): Promise<InviteAdminState> {
  // Server Actions can be called without going through the proxy.
  if (!(await isSignedIn())) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to invite an admin.",
      email: "",
    };
  }

  const rawEmail = formData.get("email");
  const parsed = schema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a valid email.",
      email: typeof rawEmail === "string" ? rawEmail : "",
    };
  }
  const { email } = parsed.data;

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.auth.admin.inviteUserByEmail(email);

    if (error) {
      if (
        error.code === "email_exists" ||
        error.code === "user_already_exists"
      ) {
        return {
          status: "error",
          message: `${email} already has an account.`,
          email,
        };
      }
      if (error.code === "over_email_send_rate_limit") {
        return {
          status: "error",
          message:
            "Too many emails have been sent recently. Wait a while and try again.",
          email,
        };
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to invite admin", error);
    return {
      status: "error",
      message: isAuthError(error)
        ? `Supabase could not send the invitation: ${error.message}`
        : "Unable to send the invitation right now. Please try again.",
      email,
    };
  }

  return {
    status: "success",
    message: `Invitation sent to ${email}. Their account is confirmed once they click the link in the email.`,
    email: "",
  };
}
