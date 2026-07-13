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
