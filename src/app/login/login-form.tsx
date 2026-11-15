"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/login/actions";
import AuthCard, { inputClassName } from "@/components/auth-card";
import SubmitButton from "@/components/submit-button";

export default function LoginForm() {
  const [state, formAction] = useActionState(signIn, {
    step: "email",
    email: "",
    status: "idle",
    message: "",
  } satisfies SignInState);

  // React resets the form after each action, so a new key is needed for the
  // inputs to pick up the returned values as their defaults.
  const inputKey = `${state.step}:${state.status}:${state.email}`;

  return (
    <AuthCard title="Sign in">
      {state.step === "email" ? (
        <form className="space-y-6" action={formAction}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-body2 text-navy-900"
            >
              Email
            </label>
            <input
              key={inputKey}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.email}
              placeholder="Enter your email address"
              className={inputClassName}
            />
          </div>

          <SubmitButton name="intent" value="send" pendingLabel="Sending...">
            Email me a sign-in link
          </SubmitButton>
          <Message state={state} />
        </form>
      ) : (
        <form className="space-y-6" action={formAction}>
          <p className="text-center text-body2 text-navy-700">
            We emailed a sign-in link and code to{" "}
            <span className="font-semibold text-navy-900">{state.email}</span>.
            Click the link, or enter the code to sign in on this device.
          </p>
          <input type="hidden" name="email" value={state.email} />
          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-body2 text-navy-900"
            >
              Code
            </label>
            <input
              key={inputKey}
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={12}
              placeholder="Enter the code from the email"
              className={`${inputClassName} tracking-widest`}
            />
          </div>

          {/* First submit button, so pressing Enter in the code field uses it. */}
          <SubmitButton
            name="intent"
            value="verify"
            pendingLabel="Signing in..."
          >
            Sign in
          </SubmitButton>
          <div className="flex items-center justify-between gap-4">
            <SubmitButton
              variant="link"
              name="intent"
              value="back"
              formNoValidate
            >
              Use a different email
            </SubmitButton>
            <SubmitButton
              variant="link"
              name="intent"
              value="send"
              formNoValidate
              pendingLabel="Sending..."
            >
              Send a new code
            </SubmitButton>
          </div>
          <Message state={state} />
        </form>
      )}
    </AuthCard>
  );
}

function Message({ state }: { state: SignInState }) {
  return (
    <p
      aria-live="polite"
      className={`min-h-5 text-center text-body2 ${
        state.status === "error" ? "text-red-700" : "text-green-700"
      }`}
    >
      {state.message}
    </p>
  );
}
