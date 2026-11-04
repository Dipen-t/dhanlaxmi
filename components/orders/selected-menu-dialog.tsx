"use client";

import { ListChecks, X } from "lucide-react";
import { useId, useMemo, useRef } from "react";

import type { OrderRecord } from "@/app/orders/actions";

type SelectedMenuDialogProps = {
  order: OrderRecord;
  className?: string;
};

export function SelectedMenuDialog({ order, className = "" }: SelectedMenuDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const groups = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const dish of order.menuDishes) {
      const dishes = grouped.get(dish.categoryName) ?? [];
      dishes.push(dish.name);
      grouped.set(dish.categoryName, dishes);
    }
    return [...grouped.entries()];
  }, [order.menuDishes]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary-soft px-3 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        <ListChecks className="size-4" strokeWidth={1.75} aria-hidden />
        View Selected Menu
        <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-xs tabular-nums text-foreground">
          {order.menuDishes.length}
        </span>
      </button>

      <dialog ref={dialogRef} className="app-dialog app-dialog-wide" aria-labelledby={titleId}>
        <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-foreground">
                Selected Menu
              </h2>
              <p className="mt-1 text-sm text-muted">
                {order.orderId} · {order.menuDishes.length} dish{order.menuDishes.length === 1 ? "" : "es"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close selected menu"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <div className="app-dialog-body min-h-0 min-w-0 overflow-y-auto overscroll-contain px-5 py-4">
            {order.menuName ? (
              <p className="mb-4 text-sm font-semibold text-foreground">{order.menuName}</p>
            ) : null}
            <ul className="space-y-5">
              {groups.map(([category, dishes]) => (
                <li key={category}>
                  <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                    <h3 className="min-w-0 break-words text-sm font-semibold text-foreground">{category}</h3>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{dishes.length}</span>
                  </div>
                  <ul className="mt-2 grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
                    {dishes.map((dish) => (
                      <li key={dish} className="flex min-w-0 items-start gap-2 text-sm text-foreground">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span className="min-w-0 break-words text-pretty">{dish}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 justify-end border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
