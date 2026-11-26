import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSignedIn } from "@/lib/supabase/server";
import VolunteerForm from "./volunteer-form";

export const metadata: Metadata = {
  title: "Add volunteer | The Refugee Centre",
};

export default async function NewVolunteerPage() {
  if (!(await isSignedIn())) redirect("/login");

  const positions = await prisma.position.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[#b2b2b2] px-8 pt-8 pb-4">
        <h1 className="text-h4">Volunteers</h1>
      </header>

      <VolunteerForm positions={positions} />
    </div>
  );
}
