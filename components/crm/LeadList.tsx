"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatRelative, enumToLabel } from "@/lib/utils";
import { useCRMStore, type Lead } from "@/lib/store/crm.store";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<string, string> = {
  NEW_LEAD: "draft",
  CONTACTED: "in-progress",
  QUALIFIED: "active",
  PROPOSAL_SENT: "sent",
  NEGOTIATION: "pending",
  WON: "won",
  LOST: "lost",
};

interface LeadListProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  canDelete: boolean;
}

export function LeadList({ leads, onEdit, canDelete }: LeadListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { invalidate } = useCRMStore();

  useEffect(() => setPage(1), [leads]);

  const totalPages = Math.ceil(leads.length / PAGE_SIZE);
  const paged = leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Delete lead "${lead.name}"?`)) return;
    setDeleting(lead.id);
    try {
      const res = await fetch(`/api/crm/${lead.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Lead deleted");
      invalidate();
      useCRMStore.getState().fetch();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--text-tertiary)]">No leads found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)]">
            {["Name", "Company", "Service", "Value", "Status", "Source", "Added", ""].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {paged.map((lead) => (
            <tr key={lead.id} className="hover:bg-[var(--interactive-secondary-hover)] transition-colors group">
              <td className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => onEdit(lead)}
                  className="font-medium text-[var(--text-primary)] hover:text-[var(--text-brand)] text-left"
                >
                  {lead.name}
                </button>
                {lead.email && (
                  <p className="text-xs text-[var(--text-tertiary)]">{lead.email}</p>
                )}
              </td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">{lead.company ?? "—"}</td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">
                {lead.service ? enumToLabel(lead.service) : "—"}
              </td>
              <td className="px-3 py-3 font-medium text-[var(--text-primary)] tabular-nums">
                {lead.estimatedValue ? formatCurrency(lead.estimatedValue, lead.currency, true) : "—"}
              </td>
              <td className="px-3 py-3">
                <Badge variant={STATUS_BADGE[lead.status] as never || "default"}>
                  {enumToLabel(lead.status)}
                </Badge>
              </td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">{lead.source ?? "—"}</td>
              <td className="px-3 py-3 text-[var(--text-tertiary)] whitespace-nowrap">
                {formatRelative(lead.createdAt)}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEdit(lead)}
                    className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(lead)}
                      disabled={deleting === lead.id}
                      className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--color-danger-500)] transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={leads.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
