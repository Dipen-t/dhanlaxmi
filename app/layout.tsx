import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';

import "./globals.css";

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
      className="antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --font-geist-sans: 'Geist', system-ui, sans-serif;
            --font-geist-mono: 'Geist Mono', monospace;
          }
        `}</style>
      </head>
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
