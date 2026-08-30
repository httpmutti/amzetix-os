import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText } from "lucide-react";
import Link from "next/link";
import type { BadgeVariant } from "@/components/ui/badge";

const PROJECT_BADGE: Record<string, BadgeVariant> = {
  PLANNED:       "draft",
  ACTIVE:        "active",
  IN_REVIEW:     "pending",
  CLIENT_REVIEW: "pending",
  ON_HOLD:       "on-hold",
  COMPLETED:     "success",
  CANCELLED:     "cancelled",
};

const INVOICE_BADGE: Record<string, BadgeVariant> = {
  DRAFT:          "draft",
  SENT:           "sent",
  PARTIALLY_PAID: "warning",
  PAID:           "paid",
  OVERDUE:        "overdue",
  CANCELLED:      "cancelled",
};

export default async function PortalHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cp = await getPortalClient(session.user.id);
  if (!cp) redirect("/login");

  const [projects, invoices] = await Promise.all([
    prisma.project.findMany({
      where: {
        clientId: cp.clientId,
        deletedAt: null,
        status: { in: ["ACTIVE", "PLANNED", "IN_REVIEW", "CLIENT_REVIEW"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, projectId: true, name: true, status: true, dueDate: true },
    }),
    prisma.invoice.findMany({
      where: {
        clientId: cp.clientId,
        deletedAt: null,
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        balanceDue: true,
        currency: true,
        status: true,
        dueDate: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Welcome back, {session.user.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {cp.client.companyName} — Client Portal
        </p>
      </div>

      {/* Active Projects */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Active Projects</h2>
          <Link href="/portal/projects" className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
            View all →
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)]" style={{ background: "var(--color-neutral-100)" }}>
              <FolderOpen size={18} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No active projects</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Your active projects will appear here.</p>
          </div>
        ) : (
          <ul>
            {projects.map((p, i) => (
              <li
                key={p.id}
                className={i < projects.length - 1 ? "border-b" : ""}
                style={{ borderColor: "var(--border-default)" }}
              >
                <Link
                  href={`/portal/projects/${p.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--interactive-secondary-hover)]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-tertiary)" }}>{p.projectId}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {p.dueDate && (
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Due {formatDate(p.dueDate)}
                      </span>
                    )}
                    <Badge variant={PROJECT_BADGE[p.status] ?? "default"}>{p.status.replace(/_/g, " ")}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Outstanding Invoices */}
      <Card padding="none">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Outstanding Invoices</h2>
          <Link href="/portal/invoices" className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
            View all →
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)]" style={{ background: "var(--color-neutral-100)" }}>
              <FileText size={18} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No outstanding invoices</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>You're all caught up.</p>
          </div>
        ) : (
          <ul>
            {invoices.map((inv, i) => (
              <li
                key={inv.id}
                className={i < invoices.length - 1 ? "border-b" : ""}
                style={{ borderColor: "var(--border-default)" }}
              >
                <Link
                  href={`/portal/invoices/${inv.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--interactive-secondary-hover)]"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{inv.invoiceNumber}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(Number(inv.balanceDue), inv.currency)}
                    </span>
                    <Badge variant={INVOICE_BADGE[inv.status] ?? "default"}>{inv.status.replace(/_/g, " ")}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
