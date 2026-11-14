import type { Metadata } from "next";
import NewAdminForm from "@/app/admins/new-admin-form";

export const metadata: Metadata = {
  title: "Add an admin | The Refugee Centre",
};

// Signed-out visitors never reach this page: proxy.ts sends them to /login,
// and the createAdmin action checks the session again on submit.
export default function AdminsPage() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[488px] rounded-lg border border-sandstone-300 bg-sandstone-100 px-7 py-10 sm:px-8 sm:py-12">
        <h1 className="mb-2 text-center text-h4 text-navy-900">Add an admin</h1>
        <p className="mb-8 text-center text-body2 text-navy-700">
          The new admin will have the same access as you. Once their account is
          created, they sign in from the sign-in page with a link sent to their
          email.
        </p>
        <NewAdminForm />
      </div>
    </section>
  );
}
