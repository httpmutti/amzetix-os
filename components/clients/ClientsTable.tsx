"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Edit2, ExternalLink, Building2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { formatRelative } from "@/lib/utils";
import { useClientsStore, type ClientSummary } from "@/lib/store/clients.store";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "active",
  ONBOARDING: "in-progress",
  LEAD: "draft",
  PAUSED: "pending",
  COMPLETED: "completed",
  LOST: "lost",
};

interface ClientsTableProps {
  clients: ClientSummary[];
  onEdit: (client: ClientSummary) => void;
  canDelete: boolean;
}

export function ClientsTable({ clients, onEdit, canDelete }: ClientsTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { invalidate } = useClientsStore();

  useEffect(() => setPage(1), [clients]);

  const totalPages = Math.ceil(clients.length / PAGE_SIZE);
  const paged = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (client: ClientSummary) => {
    if (!confirm(`Delete client "${client.companyName}"? This cannot be undone.`)) return;
    setDeleting(client.id);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Client deleted");
      invalidate();
      useClientsStore.getState().fetch();
    } catch {
      toast.error("Failed to delete client");
    } finally {
      setDeleting(null);
    }
  };

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 size={32} className="text-[var(--text-tertiary)] mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">No clients found</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Add your first client to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)]">
            {["Company", "Contact", "Country", "Currency", "Projects", "Invoices", "Status", "Added", ""].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {paged.map((client) => (
            <tr key={client.id} className="hover:bg-[var(--interactive-secondary-hover)] transition-colors group">
              <td className="px-3 py-3">
                <Link
                  href={`/clients/${client.id}`}
                  className="font-medium text-[var(--text-primary)] hover:text-[var(--text-brand)] flex items-center gap-1.5"
                >
                  {client.companyName}
                  <ExternalLink size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                </Link>
                <p className="text-xs text-[var(--text-tertiary)]">{client.clientId}</p>
              </td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">{client.contactPerson ?? "—"}</td>
              <td className="px-3 py-3 text-[var(--text-secondary)]">{client.country ?? "—"}</td>
              <td className="px-3 py-3 text-[var(--text-tertiary)] font-mono text-xs">{client.currency}</td>
              <td className="px-3 py-3 text-center text-[var(--text-secondary)]">{client._count.projects}</td>
              <td className="px-3 py-3 text-center text-[var(--text-secondary)]">{client._count.invoices}</td>
              <td className="px-3 py-3">
                <Badge variant={STATUS_BADGE[client.status] as never || "default"}>
                  {client.status.charAt(0) + client.status.slice(1).toLowerCase()}
                </Badge>
              </td>
              <td className="px-3 py-3 text-[var(--text-tertiary)] whitespace-nowrap">{formatRelative(client.createdAt)}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEdit(client)}
                    className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(client)}
                      disabled={deleting === client.id}
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
      <Pagination page={page} totalPages={totalPages} total={clients.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
