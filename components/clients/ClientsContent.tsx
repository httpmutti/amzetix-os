"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientsTable } from "./ClientsTable";
import { ClientModal } from "./ClientModal";
import { useClientsStore, type ClientSummary } from "@/lib/store/clients.store";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "LEAD", label: "Lead" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "LOST", label: "Lost" },
];

interface ClientsContentProps {
  canDelete: boolean;
}

export function ClientsContent({ canDelete }: ClientsContentProps) {
  const { data, status, fetch } = useClientsStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientSummary | null>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const loading = status === "idle" || status === "loading";

  const clients = (data?.clients ?? []).filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.clientId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCreate = () => { setEditingClient(null); setModalOpen(true); };
  const openEdit = (client: ClientSummary) => { setEditingClient(client); setModalOpen(true); };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="w-40">
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
            options={STATUS_OPTIONS}
            placeholder="All statuses"
          />
        </div>
        <div className="ml-auto">
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" /> New Client
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <ClientsTable clients={clients} onEdit={openEdit} canDelete={canDelete} />
        )}
      </div>

      <ClientModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingClient(null); }}
        client={editingClient}
      />
    </>
  );
}
