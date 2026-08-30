import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortalPrintButton } from "@/components/portal/PortalPrintButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BadgeVariant } from "@/components/ui/badge";

const INVOICE_BADGE: Record<string, BadgeVariant> = {
  DRAFT: "draft", SENT: "sent", PARTIALLY_PAID: "warning",
  PAID: "paid", OVERDUE: "overdue", CANCELLED: "cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", SENT: "Sent", PARTIALLY_PAID: "Partial",
  PAID: "Paid", OVERDUE: "Overdue", CANCELLED: "Cancelled",
};

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cp = await getPortalClient(session.user.id);
  if (!cp) redirect("/login");

  const invoice = await prisma.invoice.findUnique({
    where: { id, clientId: cp.clientId, deletedAt: null },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      payments: {
        where: { deletedAt: null },
        orderBy: { paymentDate: "desc" },
        select: { id: true, amount: true, currency: true, method: true, paymentDate: true, referenceId: true },
      },
    },
  });

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/invoices"
            className="inline-flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={15} />
            Back to Invoices
          </Link>
          <span style={{ color: "var(--border-default)" }}>/</span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{invoice.invoiceNumber}</span>
        </div>
        <PortalPrintButton />
      </div>

      {/* Invoice card */}
      <Card className="print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap pb-6 mb-6 border-b" style={{ borderColor: "var(--border-default)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Invoice</p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{invoice.invoiceNumber}</h1>
            <div className="mt-2">
              <Badge variant={INVOICE_BADGE[invoice.status] ?? "default"} dot>
                {STATUS_LABEL[invoice.status] ?? invoice.status}
              </Badge>
            </div>
          </div>
          <div className="text-right space-y-1.5 text-sm">
            <div>
              <span style={{ color: "var(--text-tertiary)" }}>Issued </span>
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{formatDate(invoice.issueDate)}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-tertiary)" }}>Due </span>
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.paidAt && (
              <div>
                <span style={{ color: "var(--text-tertiary)" }}>Paid </span>
                <span className="font-medium" style={{ color: "var(--color-success-700)" }}>{formatDate(invoice.paidAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Bill To</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{cp.client.companyName}</p>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-default)" }}>
                <th className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Description</th>
                <th className="text-right pb-3 px-4 text-xs font-semibold uppercase tracking-wider w-20" style={{ color: "var(--text-secondary)" }}>Qty</th>
                <th className="text-right pb-3 px-4 text-xs font-semibold uppercase tracking-wider w-28" style={{ color: "var(--text-secondary)" }}>Unit Price</th>
                <th className="text-right pb-3 pl-4 text-xs font-semibold uppercase tracking-wider w-28" style={{ color: "var(--text-secondary)" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr
                  key={item.id}
                  className={i < invoice.items.length - 1 ? "border-b" : ""}
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <td className="py-3 pr-4" style={{ color: "var(--text-primary)" }}>{item.description}</td>
                  <td className="py-3 px-4 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>{Number(item.quantity)}</td>
                  <td className="py-3 px-4 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                    {formatCurrency(Number(item.unitPrice), invoice.currency)}
                  </td>
                  <td className="py-3 pl-4 text-right tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(Number(item.amount), invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="space-y-2 min-w-52">
            <div className="flex justify-between gap-10 text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
              <span className="tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(Number(invoice.subtotal), invoice.currency)}
              </span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between gap-10 text-sm">
                <span style={{ color: "var(--text-secondary)" }}>Discount</span>
                <span className="tabular-nums" style={{ color: "var(--color-success-700)" }}>
                  −{formatCurrency(Number(invoice.discountAmount), invoice.currency)}
                </span>
              </div>
            )}
            {Number(invoice.taxAmount) > 0 && (
              <div className="flex justify-between gap-10 text-sm">
                <span style={{ color: "var(--text-secondary)" }}>Tax ({Number(invoice.taxRate)}%)</span>
                <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(Number(invoice.taxAmount), invoice.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-10 text-base font-bold pt-2 border-t" style={{ borderColor: "var(--border-default)" }}>
              <span style={{ color: "var(--text-primary)" }}>Total</span>
              <span className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(Number(invoice.total), invoice.currency)}
              </span>
            </div>
            {Number(invoice.amountPaid) > 0 && (
              <div className="flex justify-between gap-10 text-sm">
                <span style={{ color: "var(--text-secondary)" }}>Amount Paid</span>
                <span className="tabular-nums" style={{ color: "var(--color-success-700)" }}>
                  −{formatCurrency(Number(invoice.amountPaid), invoice.currency)}
                </span>
              </div>
            )}
            {Number(invoice.balanceDue) > 0 && (
              <div className="flex justify-between gap-10 text-base font-bold pt-2 border-t" style={{ borderColor: "var(--border-default)" }}>
                <span style={{ color: "var(--color-danger-500)" }}>Balance Due</span>
                <span className="tabular-nums" style={{ color: "var(--color-danger-500)" }}>
                  {formatCurrency(Number(invoice.balanceDue), invoice.currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-default)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Notes</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{invoice.notes}</p>
          </div>
        )}
      </Card>

      {/* Payment history */}
      {invoice.payments.length > 0 && (
        <Card padding="none" className="print:hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Payment History</p>
          </div>
          <table className="w-full text-sm">
            <thead style={{ background: "var(--surface-page)" }}>
              <tr>
                {["Date", "Amount", "Method", "Reference"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{ color: "var(--text-secondary)", borderColor: "var(--border-default)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((pay, i) => (
                <tr
                  key={pay.id}
                  className={i < invoice.payments.length - 1 ? "border-b" : ""}
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <td className="px-5 py-3.5 tabular-nums" style={{ color: "var(--text-secondary)" }}>{formatDate(pay.paymentDate)}</td>
                  <td className="px-5 py-3.5 tabular-nums font-semibold" style={{ color: "var(--color-success-700)" }}>
                    {formatCurrency(Number(pay.amount), pay.currency)}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{pay.method ?? "—"}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{pay.referenceId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
