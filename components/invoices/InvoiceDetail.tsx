"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { Edit2, Send, DollarSign, Printer, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { NumberInput } from "@/components/ui/number-input";
import { InputLabel } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface LineItem { id: string; description: string; quantity: number | string; unitPrice: number | string; amount: number | string; service?: string | null }
interface Payment { id: string; paymentNumber: string; amount: number | string; currency: string; paymentDate: string; method: string; referenceId?: string | null; notes?: string | null }
interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotal: number | string;
  discountType?: string | null;
  discountAmount: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  total: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  paymentTerms: number;
  issueDate: string;
  dueDate: string;
  sentAt?: string | null;
  paidAt?: string | null;
  paymentLink?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  client: { id: string; companyName: string; contactPerson?: string | null; email?: string | null; address?: string | null; country?: string | null };
  items: LineItem[];
  payments: Payment[];
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "draft", SENT: "sent", PARTIALLY_PAID: "in-progress",
  PAID: "completed", OVERDUE: "overdue", CANCELLED: "lost",
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "STRIPE", label: "Stripe" },
  { value: "PAYONEER", label: "Payoneer" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

interface Props {
  invoiceId: string;
  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
  canRecordPayment: boolean;
}

export function InvoiceDetail({ invoiceId, canEdit, canDelete, canSend, canRecordPayment }: Props) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | undefined>();
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payRef, setPayRef] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  const load = () => {
    window.fetch(`/api/invoices/${invoiceId}`)
      .then(r => r.json())
      .then(d => { setInvoice(d.data); setLoading(false); });
  };

  useEffect(() => { load(); }, [invoiceId]);

  const handleSend = async () => {
    if (!invoice || !confirm(`Mark ${invoice.invoiceNumber} as sent?`)) return;
    const res = await window.fetch(`/api/invoices/${invoice.id}/send`, { method: "POST" });
    if (res.ok) { toast.success("Invoice marked as sent"); load(); }
    else toast.error("Failed to send");
  };

  const handleDelete = async () => {
    if (!invoice || !confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
    const res = await window.fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); router.push("/invoices"); }
    else { const j = await res.json(); toast.error(j.error ?? "Failed"); }
  };

  const handlePrint = () => window.print();

  const handleRecordPayment = async () => {
    if (!invoice) return;
    if (!payAmount || payAmount <= 0) { toast.error("Enter a valid amount"); return; }
    setPaySubmitting(true);
    const res = await window.fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: invoice.client.id,
        invoiceId: invoice.id,
        amount: payAmount,
        currency: invoice.currency,
        paymentDate: payDate,
        method: payMethod,
        referenceId: payRef || undefined,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      toast.success("Payment recorded");
      setPaymentOpen(false);
      setPayAmount(undefined);
      setPayRef("");
      load();
    } else {
      toast.error(json.error ?? "Failed to record payment");
    }
    setPaySubmitting(false);
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 rounded-[var(--radius-lg)]" />
      <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
    </div>
  );
  if (!invoice) return <div className="p-8 text-center text-[var(--text-secondary)]">Invoice not found.</div>;

  const balance = Number(invoice.balanceDue);
  const isPaid = invoice.status === "PAID";
  const isCancelled = invoice.status === "CANCELLED";

  return (
    <div className="flex flex-col gap-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[var(--text-primary)] font-mono">{invoice.invoiceNumber}</h1>
          <Badge variant={(STATUS_BADGE[invoice.status] ?? "default") as never}>
            {invoice.status.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrint}><Printer size={13} /> Print</Button>
          {canSend && invoice.status === "DRAFT" && (
            <Button variant="outline" size="sm" onClick={handleSend}><Send size={13} /> Send</Button>
          )}
          {canRecordPayment && !isPaid && !isCancelled && (
            <Button size="sm" onClick={() => { setPayAmount(Number(invoice.balanceDue)); setPaymentOpen(true); }}>
              <DollarSign size={13} /> Record Payment
            </Button>
          )}
          {canEdit && !isPaid && (
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline" size="sm"><Edit2 size={13} /> Edit</Button>
            </Link>
          )}
          {canDelete && !isPaid && (
            <button type="button" onClick={handleDelete} className="flex h-9 items-center gap-1.5 px-3 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--color-danger-500)] cursor-pointer transition-colors border border-[var(--border-default)]">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Invoice preview card (print-friendly) */}
      <div id="invoice-print" className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-6 print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">INVOICE</p>
            <p className="text-sm font-mono text-[var(--text-secondary)] mt-1">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)]">Issue Date</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{format(new Date(invoice.issueDate), "MMM d, yyyy")}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">Due Date</p>
            <p className={`text-sm font-medium ${new Date(invoice.dueDate) < new Date() && !isPaid ? "text-[var(--color-danger-500)]" : "text-[var(--text-primary)]"}`}>
              {format(new Date(invoice.dueDate), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Client info */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Billed To</p>
          <p className="font-semibold text-[var(--text-primary)]">{invoice.client.companyName}</p>
          {invoice.client.contactPerson && <p className="text-sm text-[var(--text-secondary)]">{invoice.client.contactPerson}</p>}
          {invoice.client.email && <p className="text-sm text-[var(--text-secondary)]">{invoice.client.email}</p>}
          {invoice.client.address && <p className="text-sm text-[var(--text-secondary)]">{invoice.client.address}</p>}
        </div>

        {/* Line items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="pb-2 text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Description</th>
                <th className="pb-2 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider w-16">Qty</th>
                <th className="pb-2 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider w-28">Unit Price</th>
                <th className="pb-2 text-right text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {invoice.items.map(item => (
                <tr key={item.id}>
                  <td className="py-3">
                    <p className="text-[var(--text-primary)]">{item.description}</p>
                    {item.service && <p className="text-xs text-[var(--text-tertiary)]">{item.service.replace(/_/g, " ")}</p>}
                  </td>
                  <td className="py-3 text-right text-[var(--text-secondary)] tabular-nums">{Number(item.quantity)}</td>
                  <td className="py-3 text-right text-[var(--text-secondary)] tabular-nums">{formatCurrency(Number(item.unitPrice), invoice.currency)}</td>
                  <td className="py-3 text-right font-medium text-[var(--text-primary)] tabular-nums">{formatCurrency(Number(item.amount), invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="ml-auto w-64 flex flex-col gap-2 text-sm border-t border-[var(--border-default)] pt-4">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(Number(invoice.subtotal), invoice.currency)}</span>
          </div>
          {Number(invoice.discountAmount) > 0 && (
            <div className="flex justify-between text-[var(--color-danger-500)]">
              <span>Discount</span>
              <span className="tabular-nums">−{formatCurrency(Number(invoice.discountAmount), invoice.currency)}</span>
            </div>
          )}
          {Number(invoice.taxAmount) > 0 && (
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Tax ({Number(invoice.taxRate)}%)</span>
              <span className="tabular-nums">+{formatCurrency(Number(invoice.taxAmount), invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[var(--text-primary)] text-base border-t border-[var(--border-default)] pt-2">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(Number(invoice.total), invoice.currency)}</span>
          </div>
          {Number(invoice.amountPaid) > 0 && (
            <div className="flex justify-between text-[var(--status-active-text)]">
              <span>Paid</span>
              <span className="tabular-nums">−{formatCurrency(Number(invoice.amountPaid), invoice.currency)}</span>
            </div>
          )}
          {balance > 0 && (
            <div className="flex justify-between font-bold text-[var(--color-danger-500)] text-base">
              <span>Balance Due</span>
              <span className="tabular-nums">{formatCurrency(balance, invoice.currency)}</span>
            </div>
          )}
        </div>

        {invoice.paymentLink && (
          <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Payment Link</p>
            <a
              href={invoice.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--interactive-primary)] hover:underline break-all"
            >
              {invoice.paymentLink}
            </a>
          </div>
        )}
        {invoice.notes && (
          <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Notes</p>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment history */}
      {invoice.payments.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="px-4 py-3 border-b border-[var(--border-default)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Payment History</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                {["#","Date","Method","Reference","Amount"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map(p => (
                <tr key={p.id} className="border-b border-[var(--border-default)] last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--text-secondary)]">{p.paymentNumber}</td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">{format(new Date(p.paymentDate), "MMM d, yyyy")}</td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">{p.method.replace("_", " ")}</td>
                  <td className="px-4 py-2.5 text-[var(--text-tertiary)]">{p.referenceId ?? "—"}</td>
                  <td className="px-4 py-2.5 font-medium text-[var(--status-active-text)] tabular-nums">{formatCurrency(Number(p.amount), p.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoice.internalNotes && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Internal Notes</p>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{invoice.internalNotes}</p>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record Payment">
        <div className="flex flex-col gap-4">
          <div>
            <InputLabel>Amount</InputLabel>
            <NumberInput value={payAmount} onChange={e => setPayAmount(+e.target.value || 0)} min={0.01} step={0.01} />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Balance due: {formatCurrency(balance, invoice.currency)}</p>
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
            <InputLabel>Reference / Transaction ID</InputLabel>
            <input
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
              placeholder="Optional reference"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-input)] bg-[var(--surface-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} loading={paySubmitting}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
