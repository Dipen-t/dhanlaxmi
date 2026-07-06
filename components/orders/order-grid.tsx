import type { OrderRecord } from "@/app/orders/actions";

import { formatOrderDate, MealBadge, PersonsBadge } from "./order-badges";
import { OrderActions } from "./order-actions";

type OrderGridProps = {
  orders: OrderRecord[];
  onEdit: (order: OrderRecord) => void;
};

export function OrderGrid({ orders, onEdit }: OrderGridProps) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex flex-col rounded-xl border border-border bg-background p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{order.orderId}</p>
            <p className="mt-1 text-sm text-muted">{formatOrderDate(order.date)}</p>
            <p className="mt-2 text-sm text-foreground [text-wrap:pretty]">
              {order.venue}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <MealBadge mealType={order.mealType} />
              <PersonsBadge count={order.numberOfPersons} />
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <OrderActions order={order} onEdit={onEdit} layout="stacked" />
          </div>
        </li>
      ))}
    </ul>
  );
}
