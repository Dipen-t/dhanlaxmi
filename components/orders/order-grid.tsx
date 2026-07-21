import type { OrderRecord } from "@/app/orders/actions";

import {
  DiscountBadge,
  formatOrderDate,
  MealBadge,
  PaymentBadge,
  PersonsBadge,
} from "./order-badges";
import { OrderActions } from "./order-actions";

type OrderGridProps = {
  orders: OrderRecord[];
  onEdit: (order: OrderRecord) => void;
  onFinance: (order: OrderRecord) => void;
};

export function OrderGrid({ orders, onEdit, onFinance }: OrderGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {orders.map((order) => (
        <li key={order.id}>
          <article className="flex h-full flex-col rounded-xl border border-border bg-background p-4 sm:p-5">
            <button
              type="button"
              onClick={() => onEdit(order)}
              className="min-w-0 flex-1 touch-manipulation rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-base font-semibold text-foreground md:text-lg">
                {order.orderId}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatOrderDate(order.date)}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground text-pretty">
                {order.venue}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <MealBadge mealType={order.mealType} />
                <PersonsBadge count={order.numberOfPersons} />
                <PaymentBadge totalAmount={order.totalAmount} isPaymentAmount={order.isPaymentAmount} />
                <DiscountBadge discount={order.discount} />
              </div>
              {order.vendors?.length > 0 && (
                <div className="mt-3 text-sm text-muted text-pretty">
                  <span className="font-medium">Vendors:</span> {order.vendors.join(", ")}
                </div>
              )}
            </button>

            <div className="mt-4 border-t border-border pt-3">
              <OrderActions order={order} onEdit={onEdit} onFinance={onFinance} layout="stacked" />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
