"use client";

import { useSearchParams } from "next/navigation";

/** Keep a list's search in its URL so returning from a record restores it. */
export function useListQuery() {
  const params = useSearchParams();
  function setQuery(value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set("q", value); else next.delete("q");
    window.history.replaceState(null, "", `${window.location.pathname}${next.size ? `?${next}` : ""}`);
  }
  return [params.get("q") || "", setQuery] as const;
}
