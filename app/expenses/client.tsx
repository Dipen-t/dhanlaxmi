"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Plus, Trash2, IndianRupee, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import type { OrderSelectionItem } from "@/app/payments/actions";
import { getOrderPaymentsWithExpenses, createExpense, deleteExpense, createVendorPaymentForExpenses, type OrderPaymentRecord, type VendorDropdownItem } from "./actions";

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

type ExpensesClientProps = {
  orders: OrderSelectionItem[];
  vendors: VendorDropdownItem[];
};

export function ExpensesClient({ orders, vendors }: ExpensesClientProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | "">("");
  const [isPendingData, startDataTransition] = useTransition();
  const [payments, setPayments] = useState<OrderPaymentRecord[]>([]);

  const fetchPayments = async (orderId: number) => {
    const data = await getOrderPaymentsWithExpenses(orderId);
    setPayments(data);
  };

  useEffect(() => {
    if (selectedOrderId === "") {
      setPayments([]);
      return;
    }

    startDataTransition(() => {
      fetchPayments(selectedOrderId as number);
    });
  }, [selectedOrderId]);

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Order Selection Dropdown */}
      <section>
        <label className="block max-w-lg">
          <span className="mb-2 block text-sm font-semibold text-foreground uppercase tracking-wider">Select Order to Log Expenses</span>
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

      {/* The Notepad Stack */}
      {selectedOrderId !== "" && (
        <section className={`flex flex-col gap-6 ${isPendingData ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}`}>
          {payments.length === 0 ? (
             <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center max-w-2xl">
               <ReceiptText className="mx-auto h-8 w-8 text-muted mb-3" />
               <p className="text-base font-medium text-foreground">No payments found</p>
               <p className="mt-1 text-sm text-muted">This order hasn't received any payments yet. You need a payment to log expenses against it.</p>
             </div>
          ) : (
            payments.map(payment => (
              <PaymentNotepad 
                key={payment.id} 
                payment={payment}
                vendors={vendors}
                orderId={selectedOrderId as number}
                onRefresh={() => fetchPayments(selectedOrderId as number)} 
              />
            ))
          )}
        </section>
      )}
    </div>
  );
}

function PaymentNotepad({ payment, vendors, orderId, onRefresh }: { payment: OrderPaymentRecord, vendors: VendorDropdownItem[], orderId: number, onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"expense" | "vendor">("expense");
  const formRef = useRef<HTMLFormElement>(null);
  
  // Quick reference vars
  const totalExpenses = payment.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingAmount = payment.amount - totalExpenses;

  async function handleAddEntry(formData: FormData) {
    if (activeTab === "expense") {
      formData.append("orderPaymentId", String(payment.id));
      startTransition(async () => {
        const res = await createExpense(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Expense added");
          if (formRef.current) {
            formRef.current.reset();
            const firstInput = formRef.current.querySelector('input[name="description"]') as HTMLInputElement;
            if (firstInput) firstInput.focus();
          }
          onRefresh();
        }
      });
    } else {
      formData.append("orderId", String(orderId));
      startTransition(async () => {
        const res = await createVendorPaymentForExpenses(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Vendor payment added");
          if (formRef.current) {
            formRef.current.reset();
          }
          onRefresh();
        }
      });
    }
  }

  async function handleDeleteExpense(id: number) {
    const formData = new FormData();
    formData.append("id", String(id));
    
    startTransition(async () => {
      const res = await deleteExpense(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Expense removed");
        onRefresh();
      }
    });
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-background shadow-sm overflow-hidden max-w-2xl">
      {/* Header - Looks like the top of a page */}
      <div className="bg-surface p-5 border-b border-border flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-600">
              <IndianRupee className="size-4" />
            </div>
            <h3 className="font-bold text-foreground text-lg">₹{payment.amount}</h3>
          </div>
          <p className="text-sm text-muted">Received on {dateFormatter.format(new Date(payment.date))}</p>
          {payment.notes && <p className="mt-1.5 text-sm text-foreground/80 max-w-prose">{payment.notes}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Remaining</p>
          <p className={`text-base font-bold ${remainingAmount < 0 ? 'text-error' : 'text-foreground'}`}>
            ₹{remainingAmount}
          </p>
        </div>
      </div>

      {/* Body - The notepad lines */}
      <div className="flex flex-col">
        {/* Existing expenses */}
        <div className="flex flex-col divide-y divide-border/50">
          {payment.expenses.map((expense, index) => (
            <div key={expense.id} className="group flex items-center justify-between px-5 py-3 hover:bg-surface/30 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-xs font-mono text-muted/50 w-4 text-right">{index + 1}.</span>
                <span className="text-sm font-medium text-foreground">{expense.description}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-error">-₹{expense.amount}</span>
                <button 
                  onClick={() => handleDeleteExpense(expense.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-md disabled:opacity-0 focus-visible:opacity-100"
                  title="Remove expense"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Area: Tab selector and form */}
        <div className="flex flex-col bg-surface/10 border-t border-border/50">
          {/* Segmented Control / Tab Selector */}
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center gap-1 p-1 bg-surface/50 rounded-lg border border-border/30 max-w-sm">
              <button
                type="button"
                onClick={() => setActiveTab("expense")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === "expense" 
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                    : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                General Expense
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vendor")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === "vendor" 
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                    : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                Vendor Payment
              </button>
            </div>
          </div>

          <form 
            ref={formRef} 
            action={handleAddEntry} 
            className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <span className="hidden sm:flex items-center text-xs font-mono text-muted/40 w-4 justify-end shrink-0 select-none">
              {activeTab === "expense" ? payment.expenses.length + 1 + "." : "+"}
            </span>

            <div className="flex-1 flex flex-col sm:flex-row gap-3 min-w-0">
              {activeTab === "vendor" ? (
                <>
                  <select 
                    name="vendorId" 
                    required 
                    className="flex-1 min-w-0 h-10 rounded-md border border-border/60 bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors hover:border-border focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  >
                    <option value="" disabled hidden selected>Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    name="notes" 
                    placeholder="Notes (optional)..." 
                    autoComplete="off"
                    className="flex-1 min-w-0 h-10 rounded-md border border-transparent bg-transparent px-3 text-sm font-medium text-foreground placeholder:text-muted/70 transition-colors hover:bg-surface/50 focus:bg-background focus:border-border/60 focus:outline-none focus:ring-1 focus:ring-border/60"
                  />
                </>
              ) : (
                <input 
                  type="text" 
                  name="description" 
                  placeholder="Expense description..." 
                  required 
                  autoComplete="off"
                  className="flex-1 min-w-0 h-10 rounded-md border border-transparent bg-transparent px-3 text-sm font-medium text-foreground placeholder:text-muted/70 transition-colors hover:bg-surface/50 focus:bg-background focus:border-border/60 focus:outline-none focus:ring-1 focus:ring-border/60"
                />
              )}
            </div>

            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border/50 pt-4 sm:pt-0 sm:pl-4 shrink-0">
              <span className="text-muted/70 text-sm font-medium select-none">₹</span>
              <input 
                type="number" 
                name="amount" 
                placeholder="0" 
                min="1"
                step="1"
                required 
                className="w-full sm:w-28 h-10 rounded-md border border-border/60 bg-background px-3 text-sm font-semibold text-foreground placeholder:text-muted/50 outline-none transition-colors hover:border-border focus:border-primary focus:ring-1 focus:ring-primary text-right font-mono shadow-sm"
              />
              <button 
                type="submit"
                className="ml-2 flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background shrink-0 active:scale-95"
                title={activeTab === "expense" ? "Add Expense" : "Add Vendor Payment"}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
