import type { OrderRecord } from "@/app/orders/actions";

import {
  DiscountBadge,
  formatOrderDate,
  MealBadge,
  PaymentBadge,
  PersonsBadge,
} from "./order-badges";
import { OrderActions } from "./order-actions";

type OrderListProps = {
  orders: OrderRecord[];
  onEdit: (order: OrderRecord) => void;
  onFinance: (order: OrderRecord) => void;
};

export function OrderList({ orders, onEdit, onFinance }: OrderListProps) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {orders.map((order) => (
        <li key={order.id}>
          <div className="flex items-stretch gap-2 p-2 sm:gap-3 sm:p-2.5">
            <button
              type="button"
              onClick={() => onEdit(order)}
              className="flex min-h-16 min-w-0 flex-1 touch-manipulation flex-col items-stretch justify-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface active:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
            >
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground md:text-lg">
                  {order.orderId}
                </p>
                <p className="mt-0.5 text-sm text-muted text-pretty">
                  {formatOrderDate(order.date)} · {order.venue}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <MealBadge mealType={order.mealType} />
                <PersonsBadge count={order.numberOfPersons} />
                <PaymentBadge totalAmount={order.totalAmount} isPaymentAmount={order.isPaymentAmount} />
                <DiscountBadge discount={order.discount} />
              </div>
              {order.vendors?.length > 0 && (
                <div className="text-sm text-muted text-pretty">
                  <span className="font-medium">Vendors:</span> {order.vendors.join(", ")}
                </div>
              )}
            </button>

            <div className="flex shrink-0 items-center pr-1">
              <OrderActions order={order} onEdit={onEdit} onFinance={onFinance} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
