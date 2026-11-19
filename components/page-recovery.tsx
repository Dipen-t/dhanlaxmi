"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useTransition } from "react";
import { parentDestination } from "@/lib/navigation";

export function PageRecovery({ error, unstable_retry, reset }: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  const pathname = usePathname();
  const parent = parentDestination(pathname);
  const [pending, startTransition] = useTransition();
  useEffect(() => { console.error("Page could not load:", error); }, [error]);
  return <div className="mx-auto w-full max-w-lg space-y-4 px-5 py-16 text-center">
    <h1 className="text-xl font-semibold">This page could not load</h1>
    <p className="text-sm text-muted">Check your connection and try again. If it keeps happening, contact support{error.digest ? " and share the reference below" : ""}.</p>
    {error.digest ? <p className="break-all text-sm text-muted">Reference: {error.digest}</p> : null}
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" disabled={pending} onClick={() => startTransition(() => { const retry = unstable_retry ?? reset; if (retry) retry(); else window.location.reload(); })} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{pending ? "Trying again..." : "Try again"}</button>
      <Link href={parent.href} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{parent.label}</Link>
    </div>
  </div>;
}

export function MissingPage() {
  const parent = parentDestination(usePathname());
  return <div className="mx-auto w-full max-w-lg space-y-4 px-5 py-16 text-center">
    <h1 className="text-xl font-semibold">This page is no longer available</h1>
    <p className="text-sm text-muted">The record may have been deleted, or the link may be incorrect. Return to the list to choose another record.</p>
    <Link href={parent.href} className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{parent.label}</Link>
  </div>;
}
