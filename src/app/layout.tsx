import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "The Refugee Centre",
  description: "Volunteer portal for The Refugee Centre",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
