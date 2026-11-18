import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Sidebar from "@/components/sidebar";
import { Toaster } from "@/components/toast";
import { getCurrentUserEmail } from "@/lib/supabase/server";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "The Refugee Centre",
  description: "Volunteer portal for The Refugee Centre",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const email = await getCurrentUserEmail();

  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full">
        <Sidebar email={email} />
        <main className="min-w-0 flex-1">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
