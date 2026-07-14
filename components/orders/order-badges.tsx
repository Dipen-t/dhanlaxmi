import type { MealType } from "@/app/orders/actions";

const mealLabels: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export function formatOrderDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function MealBadge({ mealType }: { mealType: MealType }) {
  return (
    <span className="inline-flex items-center rounded-md bg-primary-soft px-2.5 py-1 text-sm font-medium text-primary">
      {mealLabels[mealType]}
    </span>
  );
}

export function PersonsBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface px-2.5 py-1 text-sm font-medium text-muted">
      {count} {count === 1 ? "person" : "persons"}
    </span>
  );
}

export function PaymentBadge({ payment, isPaymentAmount }: { payment?: string | null, isPaymentAmount: boolean }) {
  if (isPaymentAmount && payment) {
    return (
      <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Paid: {payment}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
      Unpaid
    </span>
  );
}

export function DiscountBadge({ discount }: { discount?: string | null }) {
  if (!discount) return null;
  return (
    <span className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-sm font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
      Discount: {discount}
    </span>
  );
}
