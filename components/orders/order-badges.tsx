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

export function PaymentBadge({ totalAmount, isPaymentAmount }: { totalAmount?: number | null, isPaymentAmount: boolean }) {
  if (isPaymentAmount && totalAmount) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        Total: {totalAmount}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-2.5 py-1 text-sm font-bold text-red-800 ring-1 ring-inset ring-red-600/30 animate-pulse">
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Amount Not Set
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
