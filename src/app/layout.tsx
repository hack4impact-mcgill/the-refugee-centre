import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Refugee Centre",
  description: "Volunteer portal for The Refugee Centre",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
