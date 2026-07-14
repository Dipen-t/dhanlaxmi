import { getOrdersWithVendorPayments } from "./actions";
import { PaymentsOutClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PaymentsOutPage() {
  const orders = await getOrdersWithVendorPayments();
  
  return (
    <main className="flex h-full flex-col bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Payments Out
          </h1>
          <p className="mt-1.5 text-base text-muted">
            Manage payments made to vendors for each order.
          </p>
        </div>
      </div>
      <PaymentsOutClient orders={orders} />
    </main>
  );
}
