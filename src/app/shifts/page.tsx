import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shift Management | The Refugee Centre",
};

export default function ShiftManagementPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-h4">Shift Management</h1>
      <p className="mt-4 text-body1 text-navy-700">
        Schedule and manage volunteer shifts. This page is coming soon.
      </p>
    </section>
  );
}
