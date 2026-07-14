import type { OrderWithBalance } from "@/app/payments/actions";

export function StatusBadge({ status }: { status: OrderWithBalance["status"] }) {
  const styles = {
    Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Partial: "bg-blue-50 text-blue-700 ring-blue-600/20",
    Cleared: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Waived: "bg-purple-50 text-purple-700 ring-purple-600/20",
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${styles[status]}`}>
      {status}
    </span>
  );
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
