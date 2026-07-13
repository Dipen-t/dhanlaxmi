export function SectionListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="h-10 w-full max-w-xs animate-pulse rounded-lg bg-surface" />
        <div className="h-11 w-28 shrink-0 animate-pulse rounded-lg bg-primary-soft" />
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex items-center gap-3 px-4 py-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-surface" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 max-w-[40%] animate-pulse rounded bg-surface" />
              <div className="h-3 w-56 max-w-[60%] animate-pulse rounded bg-surface" />
            </div>
          </li>
        ))}
      </ul>
      <p className="sr-only">Loading…</p>
    </div>
  );
}
