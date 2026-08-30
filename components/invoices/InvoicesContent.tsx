"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Search, ExternalLink, Trash2, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useInvoicesStore } from "@/lib/store/invoices.store";
import type { Invoice } from "@/lib/store/invoices.store";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "draft",
  SENT: "sent",
  PARTIALLY_PAID: "in-progress",
  PAID: "completed",
  OVERDUE: "overdue",
  CANCELLED: "lost",
};

const STATUS_TABS = [
  { id: "", label: "All" },
  { id: "DRAFT", label: "Draft" },
  { id: "SENT", label: "Sent" },
  { id: "PARTIALLY_PAID", label: "Partial" },
  { id: "PAID", label: "Paid" },
  { id: "OVERDUE", label: "Overdue" },
];

const PAGE_SIZE = 15;

function isOverdue(invoice: Invoice): boolean {
  return invoice.status !== "PAID" && invoice.status !== "CANCELLED" && new Date(invoice.dueDate) < new Date();
}

interface Props {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
}

export function InvoicesContent({ canCreate, canEdit, canDelete, canSend }: Props) {
  const { data, status, fetch, mutate } = useInvoicesStore();
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, activeStatus]);

  const loading = status === "idle" || status === "loading";

  const filtered = useMemo(() => {
    const all = data ?? [];
    return all.filter((inv) => {
      if (activeStatus && inv.status !== activeStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return inv.invoiceNumber.toLowerCase().includes(q) || inv.client.companyName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, search, activeStatus]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const invoices = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSend = async (inv: Invoice) => {
    if (!confirm(`Mark "${inv.invoiceNumber}" as sent?`)) return;
    const res = await window.fetch(`/api/invoices/${inv.id}/send`, { method: "POST" });
    if (res.ok) {
      toast.success("Invoice marked as sent");
      mutate((list) => list.map((i) => i.id === inv.id ? { ...i, status: "SENT", sentAt: new Date().toISOString() } : i));
    } else {
      toast.error("Failed to send");
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (!confirm(`Delete invoice "${inv.invoiceNumber}"?`)) return;
    const res = await window.fetch(`/api/invoices/${inv.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Invoice deleted");
      mutate((list) => list.filter((i) => i.id !== inv.id));
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Failed to delete");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
          <Input placeholder="Search invoices or client…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        {canCreate && (
          <Link href="/invoices/new">
            <Button size="sm"><Plus size={14} /> New Invoice</Button>
          </Link>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] pb-0 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveStatus(tab.id)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer -mb-px ${
              activeStatus === tab.id
                ? "border-[var(--interactive-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] py-16">
          <FileText size={28} className="text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">No invoices found</p>
          {canCreate && (
            <Link href="/invoices/new"><Button size="sm"><Plus size={14} /> New Invoice</Button></Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                  {["Invoice", "Client", "Amount", "Balance Due", "Due Date", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const overdue = isOverdue(inv);
                  return (
                    <tr key={inv.id} className="group border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0 hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--text-brand)] flex items-center gap-1">
                          {inv.invoiceNumber}
                          <ExternalLink size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                        </Link>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{format(new Date(inv.issueDate), "MMM d, yyyy")}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{inv.client.companyName}</td>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(Number(inv.total), inv.currency, true)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className={Number(inv.balanceDue) > 0 ? "text-[var(--color-danger-500)] font-medium" : "text-[var(--text-tertiary)]"}>
                          {Number(inv.balanceDue) > 0 ? formatCurrency(Number(inv.balanceDue), inv.currency, true) : "Settled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={overdue ? "text-[var(--color-danger-500)] font-medium" : "text-[var(--text-secondary)]"}>
                          {format(new Date(inv.dueDate), "MMM d, yyyy")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(STATUS_BADGE[inv.status] ?? "default") as never}>
                          {inv.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canSend && inv.status === "DRAFT" && (
                            <button type="button" onClick={() => handleSend(inv)} title="Mark as sent" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors">
                              <Send size={13} />
                            </button>
                          )}
                          {canDelete && inv.status !== "PAID" && (
                            <button type="button" onClick={() => handleDelete(inv)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--color-danger-500)] transition-colors">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
