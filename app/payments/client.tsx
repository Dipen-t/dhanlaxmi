"use client";

import { useState, useTransition, useEffect } from "react";
import { Banknote, Plus, Store, History } from "lucide-react";
import { toast } from "sonner";

import type { OrderSelectionItem, VendorBasicInfo, OrderPaymentInfo } from "./actions";
import { getOrderVendors, getOrderPayments, recordPayment } from "./actions";

type PaymentsClientProps = {
  orders: OrderSelectionItem[];
  allVendors: VendorBasicInfo[];
};

export function PaymentsClient({ orders, allVendors }: PaymentsClientProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | "">("");
  const [isPendingData, startDataTransition] = useTransition();
  const [isPendingPayment, startPaymentTransition] = useTransition();
  
  const [linkedVendors, setLinkedVendors] = useState<VendorBasicInfo[]>([]);
  const [orderPayments, setOrderPayments] = useState<OrderPaymentInfo[]>([]);

  // We maintain a list of manually added vendors for this session
  const [manualVendors, setManualVendors] = useState<VendorBasicInfo[]>([]);
  const [activeTab, setActiveTab] = useState<"linked" | "other">("linked");

  useEffect(() => {
    if (selectedOrderId === "") {
      setLinkedVendors([]);
      setOrderPayments([]);
      setManualVendors([]);
      setActiveTab("linked");
      return;
    }

    startDataTransition(async () => {
      const vendors = await getOrderVendors(selectedOrderId as number);
      const payments = await getOrderPayments(selectedOrderId as number);
      setLinkedVendors(vendors);
      setOrderPayments(payments);
      setManualVendors([]); // reset manual additions on order change
    });
  }, [selectedOrderId]);

  async function handleAddPayment(vendorId: number, formData: FormData) {
    if (!selectedOrderId) return;
    
    formData.append("vendorId", String(vendorId));
    formData.append("orderId", String(selectedOrderId));
    
    startPaymentTransition(async () => {
      const res = await recordPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment recorded");
        // Refetch payments to update the ledger in the UI
        const payments = await getOrderPayments(selectedOrderId as number);
        setOrderPayments(payments);
        
        // Reset the input for this form specifically
        const form = document.getElementById(`payment-form-${vendorId}`) as HTMLFormElement;
        if (form) form.reset();
      }
    });
  }

  function handleAddManualVendor(e: React.ChangeEvent<HTMLSelectElement>) {
    const vId = Number(e.target.value);
    if (!vId) return;

    const vendorToAdd = allVendors.find(v => v.id === vId);
    if (vendorToAdd && !linkedVendors.find(v => v.id === vId) && !manualVendors.find(v => v.id === vId)) {
      setManualVendors(prev => [...prev, vendorToAdd]);
      setActiveTab("linked"); // Switch back to see the newly added vendor
    }
    
    // Reset select
    e.target.value = "";
  }

  const displayedVendors = [...linkedVendors, ...manualVendors];
  const otherVendors = allVendors.filter(v => !displayedVendors.find(dv => dv.id === v.id));

  return (
    <div className="flex flex-col gap-12 max-w-6xl">
      {/* Section 1: Order Selection */}
      <section>
        <label className="block max-w-lg">
          <span className="mb-2 block text-sm font-semibold text-foreground uppercase tracking-wider">Select Order</span>
          <select 
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30 shadow-sm"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">-- Choose an order --</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderId} - {order.date} ({order.venue})
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* Section 2 & 3: Vendors Tabs */}
      {selectedOrderId !== "" && (
        <section className={isPendingData ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          
          <div className="mb-6 border-b border-border flex gap-6">
            <button
              onClick={() => setActiveTab("linked")}
              className={`pb-3 text-base font-semibold transition-colors border-b-2 ${activeTab === "linked" ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}
            >
              Linked Vendors
            </button>
            <button
              onClick={() => setActiveTab("other")}
              className={`pb-3 text-base font-semibold transition-colors border-b-2 ${activeTab === "other" ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}
            >
              Other Vendors
            </button>
          </div>

          {activeTab === "linked" ? (
            displayedVendors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center">
                <Store className="mx-auto h-8 w-8 text-muted mb-3" />
                <p className="text-base font-medium text-foreground">No linked vendors</p>
                <p className="mt-1 text-sm text-muted">This order has no raw materials assigned to vendors yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {displayedVendors.map(vendor => (
                  <VendorCard 
                    key={vendor.id} 
                    vendor={vendor} 
                    orderPayments={orderPayments} 
                    isPendingPayment={isPendingPayment} 
                    handleAddPayment={handleAddPayment} 
                  />
                ))}
              </div>
            )
          ) : (
            <div className="pt-4 max-w-sm">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">Select Vendor to Add</span>
                <select 
                  className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                  onChange={handleAddManualVendor}
                  value=""
                >
                  <option value="">-- Choose vendor --</option>
                  {otherVendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function VendorCard({ vendor, orderPayments, isPendingPayment, handleAddPayment }: any) {
  const [showHistory, setShowHistory] = useState(false);
  
  const vendorPayments = orderPayments.filter((p: OrderPaymentInfo) => p.vendorId === vendor.id);
  const totalPaid = vendorPayments.reduce((sum: number, p: OrderPaymentInfo) => sum + p.amount, 0);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-background overflow-hidden">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-lg leading-tight">{vendor.name}</h3>
              {vendorPayments.length > 0 && (
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  <History className="size-3.5" />
                  History
                </button>
              )}
            </div>
            <span className="inline-flex mt-1 items-center rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
              {vendor.deliveryLocation}
            </span>
          </div>
        </div>

        <form id={`payment-form-${vendor.id}`} action={(fd) => handleAddPayment(vendor.id, fd)} className="flex items-end gap-3">
          <label className="flex-1 block">
            <span className="sr-only">Amount</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₹</span>
              <input 
                required 
                type="number" 
                name="amount" 
                min="1" 
                step="1" 
                placeholder="0"
                disabled={isPendingPayment}
                className="min-h-11 w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50" 
              />
            </div>
          </label>
          <button 
            type="submit" 
            disabled={isPendingPayment}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 shrink-0"
          >
            <Plus className="size-4 mr-1.5" />
            Add
          </button>
        </form>
      </div>
      
      {showHistory && vendorPayments.length > 0 && (
        <div className="bg-surface/50 border-t border-border px-5 py-3">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Total Paid</p>
            <p className="text-sm font-bold text-foreground">₹{totalPaid}</p>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            {vendorPayments.map((vp: OrderPaymentInfo) => (
              <div key={vp.id} className="flex justify-between items-center text-xs text-muted">
                <span>{vp.date}</span>
                <span>₹{vp.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
