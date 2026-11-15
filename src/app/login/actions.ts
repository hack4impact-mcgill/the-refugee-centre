"use server";

import { redirect } from "next/navigation";
import { emailSchema, otpCodeSchema } from "@/lib/schemas/auth";
import {
  createSupabaseServerClient,
  getRequestOrigin,
} from "@/lib/supabase/server";

export type SignInState = {
  step: "email" | "code";
  email: string;
  status: "idle" | "success" | "error";
  message: string;
};

export async function signIn(
  prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const intent = formData.get("intent");

  if (intent === "back") {
    return {
      step: "email",
      email: prevState.email,
      status: "idle",
      message: "",
    };
  }

  const rawEmail = formData.get("email");
  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) {
    return {
      step: "email",
      email: typeof rawEmail === "string" ? rawEmail : "",
      status: "error",
      message: email.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  if (intent === "verify") {
    return verifyCode(email.data, formData.get("code"));
  }
  return sendSignInEmail(email.data, prevState.step === "code");
}

async function sendSignInEmail(
  email: string,
  isResend: boolean,
): Promise<SignInState> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Accounts are only created by invitation.
      shouldCreateUser: false,
      emailRedirectTo: await getRequestOrigin(),
    },
  });

  if (error) {
    const fail = (message: string): SignInState => ({
      step: isResend ? "code" : "email",
      email,
      status: "error",
      message,
    });

    if (error.code === "otp_disabled") {
      return fail(
        "No account exists for this email. Contact an administrator to get access.",
      );
    }
    // Supabase's rate limit messages say how long to wait.
    if (error.status === 429) {
      return fail(error.message);
    }
    console.error("Failed to send sign-in email", error);
    return fail(
      "Unable to send the sign-in email right now. Please try again.",
    );
  }

  return {
    step: "code",
    email,
    status: "success",
    message: isResend ? "We sent a new link and code." : "",
  };
}

async function verifyCode(
  email: string,
  rawCode: FormDataEntryValue | null,
): Promise<SignInState> {
  const fail = (message: string): SignInState => ({
    step: "code",
    email,
    status: "error",
    message,
  });

  const code = otpCodeSchema.safeParse(rawCode ?? "");
  if (!code.success) {
    return fail(
      code.error.issues[0]?.message ?? "Enter the code from the email.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code.data,
    type: "email",
  });

  if (error) {
    if (error.status === 429) {
      return fail(error.message);
    }
    return fail(
      "That code is invalid or has expired. Check the latest email, or send a new code.",
    );
  }

  redirect("/shifts");
}
