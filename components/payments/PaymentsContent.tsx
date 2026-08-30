"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, DollarSign, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { NumberInput } from "@/components/ui/number-input";
import { InputLabel } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { usePaymentsStore } from "@/lib/store/payments.store";
import type { Payment } from "@/lib/store/payments.store";

interface InvoiceOption {
  id: string;
  invoiceNumber: string;
  total: number | string;
  balanceDue: number | string;
  currency: string;
  client: { id: string; companyName: string };
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "STRIPE", label: "Stripe" },
  { value: "PAYONEER", label: "Payoneer" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

const PAGE_SIZE = 15;

interface Props {
  canCreate: boolean;
  canDelete: boolean;
}

export function PaymentsContent({ canCreate, canDelete }: Props) {
  const { data, status, fetch, mutate } = usePaymentsStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState<number | undefined>();
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payRef, setPayRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search]);

  const loading = status === "idle" || status === "loading";

  const filtered = useMemo(() => {
    const all = data ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter((p) => p.paymentNumber.toLowerCase().includes(q) || p.client.companyName.toLowerCase().includes(q));
  }, [data, search]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const payments = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openModal = async () => {
    const [res, partial] = await Promise.all([
      window.fetch("/api/invoices?status=SENT&limit=100"),
      window.fetch("/api/invoices?status=PARTIALLY_PAID&limit=100"),
    ]);
    const [json, pJson] = await Promise.all([res.json(), partial.json()]);
    setInvoices([...(json.data ?? []), ...(pJson.data ?? [])]);
    setInvoiceId("");
    setAmount(undefined);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod("BANK_TRANSFER");
    setPayRef("");
    setModalOpen(true);
  };

  const selectedInvoice = invoices.find(i => i.id === invoiceId);

  const handleSubmit = async () => {
    if (!invoiceId) { toast.error("Select an invoice"); return; }
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmitting(true);
    const res = await window.fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: selectedInvoice?.client.id,
        invoiceId,
        amount,
        currency: selectedInvoice?.currency ?? "USD",
        paymentDate: payDate,
        method: payMethod,
        referenceId: payRef || undefined,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      toast.success("Payment recorded");
      setModalOpen(false);
      const created: Payment = json.data ?? json;
      mutate((list) => [created, ...list]);
    } else {
      toast.error(json.error ?? "Failed");
    }
    setSubmitting(false);
  };

  const handleDelete = async (p: Payment) => {
    if (!confirm(`Delete payment ${p.paymentNumber}? This will update the invoice balance.`)) return;
    const res = await window.fetch(`/api/payments/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Payment deleted");
      mutate((list) => list.filter((x) => x.id !== p.id));
    } else {
      toast.error("Failed to delete");
    }
  };

  const invoiceOptions = [
    { value: "", label: "Select invoice…" },
    ...invoices.map(i => ({ value: i.id, label: `${i.invoiceNumber} — ${i.client.companyName} (${formatCurrency(Number(i.balanceDue), i.currency)} due)` })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
          <Input placeholder="Search payments…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        {canCreate && (
          <Button size="sm" onClick={openModal}><DollarSign size={14} /> Record Payment</Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] py-16">
          <DollarSign size={28} className="text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">No payments recorded yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                  {["Payment #","Client","Invoice","Date","Method","Reference","Amount",""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="group border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0 hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{p.paymentNumber}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{p.client.companyName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{p.invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{format(new Date(p.paymentDate), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{p.method.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-[var(--text-tertiary)]">{p.referenceId ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--status-active-text)] tabular-nums">{formatCurrency(Number(p.amount), p.currency)}</td>
                    <td className="px-4 py-3">
                      {canDelete && (
                        <button type="button" onClick={() => handleDelete(p)} className="opacity-0 group-hover:opacity-100 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--color-danger-500)] hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <div className="flex flex-col gap-4">
          <div>
            <InputLabel>Invoice</InputLabel>
            <Select value={invoiceId} onValueChange={v => { setInvoiceId(v); const inv = invoices.find(i => i.id === v); if (inv) setAmount(Number(inv.balanceDue)); }} options={invoiceOptions} />
          </div>
          <div>
            <InputLabel>Amount</InputLabel>
            <NumberInput value={amount} onChange={e => setAmount(+e.target.value || 0)} min={0.01} step={0.01} />
            {selectedInvoice && <p className="text-xs text-[var(--text-tertiary)] mt-1">Balance due: {formatCurrency(Number(selectedInvoice.balanceDue), selectedInvoice.currency)}</p>}
          </div>
          <div>
            <InputLabel>Payment Date</InputLabel>
            <DateInput value={payDate} onChange={e => setPayDate(e.target.value)} />
          </div>
          <div>
            <InputLabel>Method</InputLabel>
            <Select value={payMethod} onValueChange={setPayMethod} options={PAYMENT_METHOD_OPTIONS} />
          </div>
          <div>
            <InputLabel>Reference</InputLabel>
            <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction ID / reference…" className="w-full rounded-[var(--radius-md)] border border-[var(--border-input)] bg-[var(--surface-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
