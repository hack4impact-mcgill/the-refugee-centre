import type { Metadata } from "next";
import ConfirmForm, { LinkError } from "@/app/auth/confirm/confirm-form";
import AuthCard from "@/components/auth-card";
import { emailLinkSchema } from "@/lib/schemas/auth";
import { isSignedIn } from "@/lib/supabase/server";

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
  const signedIn = await isSignedIn();

  if (!link.success) {
    return (
      <AuthCard title="Sign in">
        <LinkError
          message="This link is incomplete. Request a new one."
          signedIn={signedIn}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={link.data.type === "invite" ? "Accept your invitation" : "Sign in"}
    >
      <ConfirmForm link={link.data} signedIn={signedIn} />
    </AuthCard>
  );
}
