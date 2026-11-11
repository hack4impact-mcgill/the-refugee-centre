"use client";

import { signInWithEmailPassword } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter both your email and password.");
      setIsError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmailPassword(email.trim(), password);
      setMessage("Signed in successfully.");
      setIsError(false);
      router.push("/shifts");
      router.refresh();
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

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-body2 text-navy-900"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-sandstone-300 bg-white px-3 py-2 text-body1 text-navy-900 outline-none placeholder:text-sandstone-600 focus:border-navy-700 focus:ring-2 focus:ring-navy-300"
            />
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => {
                  setMessage("Password recovery is not available yet.");
                  setIsError(true);
                }}
                className="text-body2 font-bold text-navy-800 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-navy-900 px-5 py-2.5 text-body1 text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Log In"}
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
          <button
            type="button"
            onClick={() => {
              setMessage("Account creation is not available yet.");
              setIsError(true);
            }}
            className="font-bold hover:underline"
          >
            Create an account
          </button>
        </p>
      </section>
    </main>
  );
}
