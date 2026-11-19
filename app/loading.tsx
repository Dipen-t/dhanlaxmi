export default function Loading() {
  return <div role="status" className="mx-auto w-full max-w-3xl space-y-4 px-5 py-12">
    <p className="text-sm text-muted">Loading page...</p>
    <div aria-hidden className="h-12 animate-pulse rounded-lg bg-surface" />
    <div aria-hidden className="h-48 animate-pulse rounded-lg bg-surface" />
  </div>;
}
