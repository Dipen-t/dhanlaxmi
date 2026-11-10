"use client";

import { BellRing, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { OrderRecord } from "@/app/orders/actions";
import { parseCalendarDate, formatDateDisplay } from "@/lib/utils";

function isPaymentOverdue(order: OrderRecord): boolean {
  if (order.isPaymentAmount) return false;
  try {
    const eventDate = parseCalendarDate(order.date);
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() + 4);
    reminderDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today >= reminderDate;
  } catch {
    return false;
  }
}

function sessionKey(orderId: number): string {
  return `dismissed-payment-reminder-${orderId}`;
}

type PaymentReminderBannerProps = {
  orders: OrderRecord[];
};

export function PaymentReminderBanner({ orders }: PaymentReminderBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Hydration-safe: read sessionStorage only after mount
  useEffect(() => {
    const initial = new Set<number>();
    for (const order of orders) {
      if (sessionStorage.getItem(sessionKey(order.id)) === "true") {
        initial.add(order.id);
      }
    }
    setDismissed(initial);
    setMounted(true);
  }, [orders]);

  const overdueOrders = orders.filter(
    (o) => isPaymentOverdue(o) && !dismissed.has(o.id)
  );

  // Render nothing until mounted (avoid SSR/hydration mismatch) or if no overdue
  if (!mounted || overdueOrders.length === 0) return null;

  function dismissOne(id: number) {
    sessionStorage.setItem(sessionKey(id), "true");
    setDismissed((prev) => new Set([...prev, id]));
  }

  function dismissAll() {
    for (const order of overdueOrders) {
      sessionStorage.setItem(sessionKey(order.id), "true");
    }
    setDismissed((prev) => {
      const next = new Set(prev);
      overdueOrders.forEach((o) => next.add(o.id));
      return next;
    });
  }

  function navigateToFinance(id: number) {
    router.push(`/orders/${id}/finance`);
  }

  return (
    <div
      role="alert"
      className="mb-5 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs backdrop-blur-sm dark:border-amber-700/60 dark:bg-amber-950/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
            <BellRing className="size-4 animate-bounce" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
              Please Update Event Payment Status
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {overdueOrders.length} event{overdueOrders.length === 1 ? "" : "s"} completed 4+ days ago with pending payment
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissAll}
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-amber-200 dark:hover:bg-amber-900/60"
        >
          Dismiss All
        </button>
      </div>

      {/* Order rows */}
      <ul className="mt-3.5 space-y-2">
        {overdueOrders.map((order) => (
          <li
            key={order.id}
            className="flex items-center justify-between gap-2.5 rounded-xl border border-amber-200/80 bg-white/90 p-2.5 shadow-2xs transition-colors hover:border-amber-300 hover:bg-white dark:border-amber-800/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/40"
          >
            <button
              type="button"
              onClick={() => navigateToFinance(order.id)}
              className="group flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                  {order.orderId}
                  {order.customerName ? (
                    <span className="font-normal text-muted"> · {order.customerName}</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">
                  {formatDateDisplay(order.date)} · {order.venue}
                </p>
              </div>
              <span className="hidden items-center gap-1 text-xs font-semibold text-primary group-hover:underline sm:inline-flex">
                Update Status <ArrowRight className="size-3" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => dismissOne(order.id)}
              aria-label={`Dismiss reminder for ${order.orderId}`}
              title="Dismiss"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-amber-300 dark:hover:bg-amber-900/50"
            >
              <X className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
