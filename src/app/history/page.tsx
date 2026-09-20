import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History | The Refugee Centre",
};

export default function HistoryPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-h4">History</h1>
      <p className="mt-4 text-body1 text-navy-700">
        Review past shifts and activity. This page is coming soon.
      </p>
    </section>
  );
}
