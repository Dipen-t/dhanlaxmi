import type { OrderRecord } from "@/app/orders/actions";

import { formatOrderDate, MealBadge, PersonsBadge } from "./order-badges";
import { OrderActions } from "./order-actions";

type OrderListProps = {
  orders: OrderRecord[];
  onEdit: (order: OrderRecord) => void;
};

export function OrderList({ orders, onEdit }: OrderListProps) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {orders.map((order) => (
        <li key={order.id} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{order.orderId}</p>
              <p className="mt-0.5 text-sm text-muted">
                {formatOrderDate(order.date)} · {order.venue}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <MealBadge mealType={order.mealType} />
              <PersonsBadge count={order.numberOfPersons} />
            </div>
            <OrderActions order={order} onEdit={onEdit} />
          </div>
        </li>
      ))}
    </ul>
  );
}
