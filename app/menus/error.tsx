"use client";

import { useEffect } from "react";

export default function MenusError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Menus page error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <h2 className="text-lg font-semibold text-foreground">Menus couldn’t load</h2>
      <p className="text-sm text-muted text-pretty">
        The server hit an error while loading menus. On Termux, rebuild with Webpack
        after pulling the latest code, then restart the app.
      </p>
      <p className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-muted break-all">
        {error.message || "Unknown error"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
