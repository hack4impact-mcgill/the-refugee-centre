"use client";

import { sendMagicLink } from "@/lib/supabase/auth";
import Link from "next/link";
import { type FormEvent, useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-sandstone-300 bg-white px-3 py-2 text-body1 text-navy-900 outline-none placeholder:text-sandstone-600 focus:border-navy-700 focus:ring-2 focus:ring-navy-300";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    setIsSubmitting(true);

    try {
      await sendMagicLink(
        email.trim(),
        `${window.location.origin}/auth/callback`,
        true,
      );
      setMessage(
        "Check your email for a link to finish creating your account.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your account right now.",
      );
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-6 py-10">
      <section className="w-full max-w-[520px] rounded-lg border border-sandstone-300 bg-sandstone-100 px-7 py-10 sm:px-8 sm:py-12">
        <h1 className="mb-8 text-center text-h4 text-navy-900">
          Create an account
        </h1>

        <form className="space-y-7" onSubmit={handleSubmit}>
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
              className={inputClassName}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-navy-900 px-5 py-2.5 text-body1 text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending link..." : "Continue with email"}
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
          Already have an account?{" "}
          <Link href="/login" className="font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
