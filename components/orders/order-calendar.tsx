"use client";

import { ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import type { OrderRecord } from "@/app/orders/actions";
import { formatEventTime } from "@/lib/orders/event-time";
import { isMenuPending } from "@/lib/orders/menu-status";
import { formatCurrency } from "@/lib/utils";

import { ExtraPlatesBadge, MealBadge, MenuPendingBadge, PersonsBadge } from "./order-badges";
import { OrderActions } from "./order-actions";
import { SelectedMenuDialog } from "./selected-menu-dialog";

type OrderCalendarProps = {
  orders: OrderRecord[];
  onEdit: (order: OrderRecord) => void;
  onFinance: (order: OrderRecord) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getCalendarDays(anchor: Date) {
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

export function OrderCalendar({ orders, onEdit, onFinance }: OrderCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);
  const [anchor, setAnchor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const ordersByDate = useMemo(() => {
    const grouped = new Map<string, OrderRecord[]>();
    for (const order of orders) {
      const existing = grouped.get(order.date) ?? [];
      existing.push(order);
      grouped.set(order.date, existing);
    }
    return grouped;
  }, [orders]);

  const calendarDays = useMemo(() => getCalendarDays(anchor), [anchor]);
  const selectedOrders = ordersByDate.get(selectedDate) ?? [];
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(anchor);

  function changeMonth(offset: number) {
    setAnchor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function goToToday() {
    setAnchor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-background" aria-label="Order calendar">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-4">
          <h2 className="text-lg font-semibold text-foreground" aria-live="polite">
            {monthLabel}
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <p
              className="inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2 py-1 text-xs font-medium text-warning ring-1 ring-inset ring-warning/30"
              title="Orders with no dishes selected yet"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
              Menu pending = menu not selected
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className="inline-flex size-11 touch-manipulation items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className="inline-flex size-11 touch-manipulation items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight className="size-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border bg-surface/60" aria-hidden>
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted sm:text-sm">
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7" role="grid" aria-label={monthLabel}>
          {calendarDays.map((date) => {
            const dateKey = toDateKey(date);
            const dayOrders = ordersByDate.get(dateKey) ?? [];
            const pendingCount = dayOrders.filter(isMenuPending).length;
            const isCurrentMonth = date.getMonth() === anchor.getMonth();
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const accessibleDate = formatSelectedDate(dateKey);
            const pendingLabel =
              pendingCount > 0
                ? `, ${pendingCount} with menu pending`
                : "";

            return (
              <button
                key={dateKey}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${accessibleDate}, ${dayOrders.length} order${dayOrders.length === 1 ? "" : "s"}${pendingLabel}`}
                onClick={() => setSelectedDate(dateKey)}
                className={`min-h-20 min-w-0 touch-manipulation border-r border-b border-border p-1.5 text-left transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-24 sm:p-2 ${
                  isSelected ? "bg-primary-soft" : "hover:bg-surface"
                } ${isCurrentMonth ? "text-foreground" : "bg-surface/35 text-muted/70"} ${
                  pendingCount > 0 && !isSelected ? "bg-warning-soft/40" : ""
                }`}
              >
                <span className="flex items-center justify-between gap-0.5">
                  <span
                    className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-medium ${
                      isToday ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {pendingCount > 0 ? (
                    <span
                      className="inline-flex size-2 shrink-0 rounded-full bg-warning ring-2 ring-warning/30"
                      title={`${pendingCount} menu pending`}
                      aria-hidden
                    />
                  ) : null}
                </span>
                <span className="mt-1 block space-y-1">
                  {dayOrders.slice(0, 2).map((order) => {
                    const pending = isMenuPending(order);
                    return (
                      <span
                        key={order.id}
                        className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-4 sm:text-xs ${
                          pending
                            ? "bg-warning-soft text-warning ring-1 ring-inset ring-warning/40"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {pending ? (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide" aria-hidden>
                            !
                          </span>
                        ) : null}
                        <span className="truncate">{order.orderId}</span>
                        {pending ? <span className="sr-only"> — menu pending</span> : null}
                      </span>
                    );
                  })}
                  {dayOrders.length > 2 ? (
                    <span className="block px-1 text-[11px] font-medium text-muted sm:text-xs">
                      +{dayOrders.length - 2} more
                      {pendingCount > 0 ? ` · ${pendingCount} menu pending` : null}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="rounded-xl border border-border bg-background p-4 xl:sticky xl:top-28" aria-label="Selected day orders">
        <div className="border-b border-border pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Selected date</p>
          <h2 className="mt-1 text-base font-semibold text-foreground text-pretty">
            {formatSelectedDate(selectedDate)}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {selectedOrders.length} order{selectedOrders.length === 1 ? "" : "s"}
          </p>
        </div>

        {selectedOrders.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-foreground">No orders on this date</p>
            <p className="mt-1 text-sm text-muted">Select another date or add a new order.</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {selectedOrders.map((order) => {
              const pending = isMenuPending(order);
              return (
              <li
                key={order.id}
                className={`rounded-lg border p-3 ${
                  pending
                    ? "border-warning/50 bg-warning-soft/30 ring-1 ring-warning/25"
                    : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onEdit(order)}
                  className="w-full touch-manipulation rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{order.orderId}</span>
                    <MenuPendingBadge order={order} />
                  </span>
                  <span className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                    <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                    <span className="text-pretty">{order.venue}</span>
                  </span>
                  {order.customerName ? (
                    <span className="mt-1 block text-sm text-muted">{order.customerName}</span>
                  ) : null}
                  {order.eventTime ? (
                    <span className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Clock3 className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                      {formatEventTime(order.eventTime)}
                    </span>
                  ) : null}
                  <span className="mt-2 flex flex-wrap gap-2">
                    <MealBadge mealType={order.mealType} />
                    <PersonsBadge count={order.numberOfPersons + order.extraPlates} />
                    <ExtraPlatesBadge count={order.extraPlates} />
                  </span>
                  {order.totalAmount !== null ? (
                    <span className="mt-2 block text-sm font-medium text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  ) : null}
                  {pending ? (
                    <div className="mt-3 border-t border-warning/30 pt-3">
                      <p className="text-sm font-medium text-warning">
                        Menu not selected — add dishes before notifying vendors.
                      </p>
                    </div>
                  ) : null}
                </button>
                {!pending && order.menuDishes.length > 0 ? (
                  <div className="mt-3 border-t border-border pt-3">
                    <SelectedMenuDialog order={order} className="w-full" />
                  </div>
                ) : null}
                <div className="mt-3 border-t border-border pt-3">
                  <OrderActions order={order} onEdit={onEdit} onFinance={onFinance} layout="stacked" />
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}
