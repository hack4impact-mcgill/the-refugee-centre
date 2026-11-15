import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { confirmEmailLink } from "@/app/auth/confirm/actions";
import AuthCard from "@/components/auth-card";
import SubmitButton from "@/components/submit-button";
import { emailLinkSchema } from "@/lib/schemas/auth";

export const metadata: Metadata = {
  title: "Sign in | The Refugee Centre",
};

// Sign-in and invitation emails link here. The token is only used when the
// person clicks the button: email security scanners open every link in an
// email, and would use up a one-time token checked on page load.
export default async function ConfirmPage({
  searchParams,
}: PageProps<"/auth/confirm">) {
  const link = emailLinkSchema.safeParse(await searchParams);
  if (!link.success) redirect("/login?authError=1");

  const isInvite = link.data.type === "invite";

  return (
    <AuthCard title={isInvite ? "Accept your invitation" : "Sign in"}>
      <form className="space-y-6" action={confirmEmailLink}>
        <p className="text-center text-body2 text-navy-700">
          {isInvite
            ? "Confirm your account to sign in to The Refugee Centre."
            : "Continue to finish signing in."}
        </p>
        <input type="hidden" name="token_hash" value={link.data.token_hash} />
        <input type="hidden" name="type" value={link.data.type} />
        <SubmitButton pendingLabel="Signing in...">
          {isInvite ? "Accept invitation" : "Continue"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
