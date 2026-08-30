import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";
import Link from "next/link";
import type { BadgeVariant } from "@/components/ui/badge";

const INVOICE_BADGE: Record<string, BadgeVariant> = {
  DRAFT:          "draft",
  SENT:           "sent",
  PARTIALLY_PAID: "warning",
  PAID:           "paid",
  OVERDUE:        "overdue",
  CANCELLED:      "cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", SENT: "Sent", PARTIALLY_PAID: "Partial",
  PAID: "Paid", OVERDUE: "Overdue", CANCELLED: "Cancelled",
};

export default async function PortalInvoicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cp = await getPortalClient(session.user.id);
  if (!cp) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    where: { clientId: cp.clientId, deletedAt: null },
    orderBy: { issueDate: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      issueDate: true,
      dueDate: true,
      total: true,
      amountPaid: true,
      balanceDue: true,
      currency: true,
    },
  });

  const totalOutstanding = invoices
    .filter(i => ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(i.status))
    .reduce((s, i) => s + Number(i.balanceDue), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Invoices</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {totalOutstanding > 0 && (
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Outstanding</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: "var(--color-danger-500)" }}>
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
        )}
      </div>

      <Card padding="none">
        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" description="Your invoices will appear here once they're issued." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "var(--surface-page)" }}>
                <tr>
                  {["Invoice", "Issued", "Due", "Total", "Balance", "Status"].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b"
                      style={{ color: "var(--text-secondary)", borderColor: "var(--border-default)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr
                    key={inv.id}
                    className={`transition-colors hover:bg-[var(--interactive-secondary-hover)] ${i < invoices.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/portal/invoices/${inv.id}`}
                        className="text-sm font-semibold hover:underline"
                        style={{ color: "var(--color-accent)" }}
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(Number(inv.total), inv.currency)}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums font-semibold" style={{ color: Number(inv.balanceDue) > 0 ? "var(--color-danger-500)" : "var(--text-tertiary)" }}>
                      {formatCurrency(Number(inv.balanceDue), inv.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={INVOICE_BADGE[inv.status] ?? "default"} dot>
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
