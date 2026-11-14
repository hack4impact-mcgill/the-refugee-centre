import type { Metadata } from "next";
import NewAdminForm from "@/app/admins/new-admin-form";

export const metadata: Metadata = {
  title: "Invite an admin | The Refugee Centre",
};

export default function AdminsPage() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[488px] rounded-lg border border-sandstone-300 bg-sandstone-100 px-7 py-10 sm:px-8 sm:py-12">
        <h1 className="mb-2 text-center text-h4 text-navy-900">
          Invite an admin
        </h1>
        <p className="mb-8 text-center text-body2 text-navy-700">
          We&apos;ll email them an invitation link. Their account stays
          unconfirmed until they click it, then they&apos;re signed in with the
          same access as you.
        </p>
        <NewAdminForm />
      </div>
    </section>
  );
}
