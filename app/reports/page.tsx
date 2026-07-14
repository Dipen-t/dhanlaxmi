import { Suspense } from "react";
import { getEventProfitabilityReport, getMasterLedger } from "./actions";
import { ReportsClient } from "./client";

export const metadata = {
  title: "Reports | Dhanlaxmi Catering",
};

export default async function ReportsPage() {
  const [profitabilityReports, ledger] = await Promise.all([
    getEventProfitabilityReport(),
    getMasterLedger(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Financial Reports
          </h1>
          <p className="text-sm text-muted">
            Detailed breakdown of your event profitability and cash flow.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="p-12 text-center text-muted">Loading reports...</div>}>
        <ReportsClient profitabilityReports={profitabilityReports} ledger={ledger} />
      </Suspense>
    </div>
  );
}
