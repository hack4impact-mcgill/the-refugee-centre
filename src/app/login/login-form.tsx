"use client";

import { sendMagicLink } from "@/lib/supabase/auth";
import Link from "next/link";
import { type FormEvent, useState } from "react";

export default function LoginForm({ hasAuthError }: { hasAuthError: boolean }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    hasAuthError
      ? "That sign-in link is invalid or has expired. Request a new one."
      : "",
  );
  const [isError, setIsError] = useState(hasAuthError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setIsError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await sendMagicLink(
        email.trim(),
        `${window.location.origin}/auth/callback`,
        false,
      );
      setMessage("Check your email for a sign-in link.");
      setIsError(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Supabase right now.",
      );
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-10">
      <section className="w-full max-w-[488px] rounded-lg border border-sandstone-300 bg-sandstone-100 px-7 py-10 sm:px-8 sm:py-12">
        <h1 className="mb-8 text-center text-h4 text-navy-900">Sign in</h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-body2 text-navy-900"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              className="w-full rounded-lg border border-sandstone-300 bg-white px-3 py-2 text-body1 text-navy-900 outline-none placeholder:text-sandstone-600 focus:border-navy-700 focus:ring-2 focus:ring-navy-300"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-navy-900 px-5 py-2.5 text-body1 text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending link..." : "Email me a sign-in link"}
          </button>
          <p
            aria-live="polite"
            className={`min-h-5 text-center text-body2 ${
              isError ? "text-red-700" : "text-green-700"
            }`}
          >
            {message}
          </p>
        </form>

        <p className="mt-1 text-center text-body2 text-navy-800">
          Need an account?{" "}
          <Link href="/register" className="font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
