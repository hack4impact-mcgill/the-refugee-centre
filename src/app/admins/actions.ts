"use server";

import { z } from "zod";
import { isAuthError } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSignedIn } from "@/lib/supabase/server";

export type CreateAdminState = {
  status: "idle" | "success" | "error";
  message: string;
  /** Echoed back on errors so the field keeps what was typed. */
  email: string;
};

const schema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
});

/**
 * Creates a confirmed Supabase Auth account for a new admin. Every account is
 * an admin, so any signed-in user may add another. The new admin then signs
 * in from /login with a magic link.
 */
export async function createAdmin(
  _prevState: CreateAdminState,
  formData: FormData,
): Promise<CreateAdminState> {
  // The proxy already blocks signed-out users, but Server Actions can be
  // called directly, so check again here.
  if (!(await isSignedIn())) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to add an admin.",
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
    const { error } = await supabase.auth.admin.createUser({
      email,
      // The account is created by a trusted admin, so skip the confirmation
      // email. The new admin proves they own the address by using the magic
      // link sent when they sign in.
      email_confirm: true,
    });

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
      throw error;
    }
  } catch (error) {
    console.error("Failed to create admin", error);
    return {
      status: "error",
      message: isAuthError(error)
        ? `Supabase could not create the account: ${error.message}`
        : "Unable to create the account right now. Please try again.",
      email,
    };
  }

  return {
    status: "success",
    message: `Account created for ${email}. They can now sign in from the sign-in page with that email.`,
    email: "",
  };
}
