import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Catering Demo",
    template: "%s · Catering Demo",
  },
  description:
    "Manage catering raw materials, vendors, and orders in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-background text-foreground"
      >
        <NextTopLoader color="#ea580c" showSpinner={false} />
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
