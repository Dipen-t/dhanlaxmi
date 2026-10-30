"use client";

import { useMemo, useState } from "react";

import type { OrderRecord } from "@/app/orders/actions";
import { formatOrderDate, MealBadge, PersonsBadge } from "./order-badges";

type OrdersCalendarProps = {
  orders: OrderRecord[];
  onEdit: (order: OrderRecord) => void;
};

function startOfDayKey(date: string) {
  return date;
}

function groupMenuByCategory(order: OrderRecord) {
  const map = new Map<string, string[]>();
  for (const dish of order.menuDishes) {
    const list = map.get(dish.categoryName) ?? [];
    list.push(dish.name);
    map.set(dish.categoryName, list);
  }
  return [...map.entries()];
}

export function OrdersCalendar({ orders, onEdit }: OrdersCalendarProps) {
  const days = useMemo(() => {
    const byDay = new Map<string, OrderRecord[]>();
    for (const order of orders) {
      const key = startOfDayKey(order.date);
      const list = byDay.get(key) ?? [];
      list.push(order);
      byDay.set(key, list);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [orders]);

  const [selectedDay, setSelectedDay] = useState<string | null>(
    () => days[0]?.[0] ?? null,
  );

  const activeDay = selectedDay && byDayHas(days, selectedDay)
    ? selectedDay
    : days[0]?.[0] ?? null;
  const dayOrders = activeDay
    ? days.find(([key]) => key === activeDay)?.[1] ?? []
    : [];

  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <aside className="rounded-xl border border-border bg-background p-3">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Event days
        </p>
        <ul className="space-y-1">
          {days.map(([day, list]) => {
            const selected = day === activeDay;
            return (
              <li key={day}>
                <button
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-surface text-foreground"
                  }`}
                >
                  <span className="font-medium">{formatOrderDate(day)}</span>
                  <span className={selected ? "opacity-90" : "text-muted"}>
                    {list.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="space-y-3" aria-label="Day details">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {activeDay ? formatOrderDate(activeDay) : "Select a day"}
            </h2>
            <p className="text-sm text-muted">
              {dayOrders.length} order{dayOrders.length === 1 ? "" : "s"} · shown in sequence 1→N
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {dayOrders.map((order, index) => {
            const menuGroups = groupMenuByCategory(order);
            return (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => onEdit(order)}
                  className="w-full rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        #{index + 1} · {order.orderId}
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {order.customerName || "Unnamed customer"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{order.venue}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <MealBadge mealType={order.mealType} />
                      <PersonsBadge count={order.numberOfPersons} />
                    </div>
                  </div>

                  {order.customerPhone ? (
                    <p className="mt-2 text-sm text-muted">{order.customerPhone}</p>
                  ) : null}

                  {/* Menu under customer info — mirrors Mila booking detail */}
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Menu
                    </p>
                    {order.menuName ? (
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {order.menuName}
                      </p>
                    ) : null}
                    {menuGroups.length === 0 ? (
                      <p className="mt-1 text-sm text-muted">No menu items selected yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {menuGroups.map(([category, dishes]) => (
                          <li key={category}>
                            <p className="text-sm font-medium text-foreground">{category}</p>
                            <p className="text-sm text-muted text-pretty">
                              {dishes.join(", ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function byDayHas(days: [string, OrderRecord[]][], key: string) {
  return days.some(([day]) => day === key);
}
