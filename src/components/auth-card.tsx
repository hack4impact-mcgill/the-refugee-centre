import Image from "next/image";
import type { ReactNode } from "react";

// Class names live here rather than in the "use client" submit button, since
// a Server Component importing them from a client module gets a reference
// instead of the string.
export const inputClassName =
  "w-full rounded-lg border border-sandstone-300 bg-white px-3 py-2 text-body1 text-navy-900 outline-none placeholder:text-sandstone-600 focus:border-navy-700 focus:ring-2 focus:ring-navy-300";

export const primaryButtonClassName =
  "w-full rounded-lg bg-navy-900 px-5 py-2.5 text-body1 text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:cursor-not-allowed disabled:opacity-70";

export const linkButtonClassName =
  "cursor-pointer text-body2 text-navy-700 underline underline-offset-2 hover:text-navy-900 disabled:cursor-not-allowed disabled:opacity-70";

export default function AuthCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-10">
      <Image
        src="/trc-logo.svg"
        alt="The Refugee Centre"
        width={102}
        height={90}
        className="mb-6"
      />
      <section className="w-full max-w-[488px] rounded-lg border border-sandstone-300 bg-sandstone-100 px-7 py-10 sm:px-8 sm:py-12">
        <h1 className="mb-8 text-center text-h4 text-navy-900">{title}</h1>
        {children}
      </section>
    </div>
  );
}
