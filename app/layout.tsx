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
        <NextTopLoader color="#0f766e" showSpinner={false} />
        <AppShell>{children}</AppShell>
        <Toaster 
          position="top-center" 
          toastOptions={{
            className: "font-sans bg-background text-foreground border border-border shadow-sm rounded-lg",
            classNames: {
              error: "bg-error-soft text-error border-error/20",
              success: "bg-emerald-50 text-emerald-700 border-emerald-200",
              info: "bg-primary-soft text-primary border-primary/20",
              warning: "bg-amber-50 text-amber-700 border-amber-200"
            }
          }}
        />
      </body>
    </html>
  );
}
