"use client";

import { useActionState } from "react";
import { inviteAdmin, type InviteAdminState } from "@/app/admins/actions";

const initialState: InviteAdminState = {
  status: "idle",
  message: "",
  email: "",
};

export default function NewAdminForm() {
  const [state, formAction, pending] = useActionState(
    inviteAdmin,
    initialState,
  );

  return (
    <form className="space-y-6" action={formAction}>
      <div>
        <label htmlFor="email" className="mb-2 block text-body2 text-navy-900">
          Email
        </label>
        <input
          // Remount to keep the email on errors and clear it on success.
          key={`${state.status}:${state.email}`}
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          required
          defaultValue={state.email}
          placeholder="Enter the new admin's email address"
          className="w-full rounded-lg border border-sandstone-300 bg-white px-3 py-2 text-body1 text-navy-900 outline-none placeholder:text-sandstone-600 focus:border-navy-700 focus:ring-2 focus:ring-navy-300"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-navy-900 px-5 py-2.5 text-body1 text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Sending invitation..." : "Send invitation"}
      </button>
      <p
        aria-live="polite"
        className={`min-h-5 text-center text-body2 ${
          state.status === "error" ? "text-red-700" : "text-green-700"
        }`}
      >
        {state.message}
      </p>
    </form>
  );
}
