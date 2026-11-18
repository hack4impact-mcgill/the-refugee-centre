"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  confirmEmailLink,
  type ConfirmState,
} from "@/app/auth/confirm/actions";
import { primaryButtonClassName } from "@/components/auth-card";
import SubmitButton from "@/components/submit-button";
import type { EmailLink } from "@/lib/schemas/auth";

export default function ConfirmForm({
  link,
  signedIn,
}: {
  link: EmailLink;
  signedIn: boolean;
}) {
  const [state, formAction] = useActionState(confirmEmailLink, {
    error: "",
  } satisfies ConfirmState);

  if (state.error) {
    return <LinkError message={state.error} signedIn={signedIn} />;
  }

  const isInvite = link.type === "invite";

  return (
    <form className="space-y-6" action={formAction}>
      <p className="text-center text-body2 text-navy-700">
        {isInvite
          ? "Confirm your account to sign in to The Refugee Centre."
          : "Continue to finish signing in."}
      </p>
      <input type="hidden" name="token_hash" value={link.token_hash} />
      <input type="hidden" name="type" value={link.type} />
      <SubmitButton pendingLabel="Signing in...">
        {isInvite ? "Accept invitation" : "Continue"}
      </SubmitButton>
    </form>
  );
}

export function LinkError({
  message,
  signedIn,
}: {
  message: string;
  signedIn: boolean;
}) {
  return (
    <div className="space-y-6">
      <p role="alert" className="text-center text-body2 text-red-700">
        {message}
      </p>
      <Link
        href={signedIn ? "/shifts" : "/login"}
        className={`block text-center ${primaryButtonClassName}`}
      >
        {signedIn ? "Go to the calendar" : "Back to sign in"}
      </Link>
    </div>
  );
}
