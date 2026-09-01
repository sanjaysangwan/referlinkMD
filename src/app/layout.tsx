import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — Referrals that arrive`,
  description:
    "A clinical referral workspace. Primary care sends a patient. Specialists are alerted by text or phone. Both sides see their patterns.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
