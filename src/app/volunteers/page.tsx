import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Volunteers | The Refugee Centre",
};

export default function VolunteersPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-h4">Volunteers</h1>
      <p className="mt-4 text-body1 text-navy-700">
        View and manage volunteer profiles. This page is coming soon.
      </p>
    </section>
  );
}
