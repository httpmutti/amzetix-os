"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadPipeline } from "./LeadPipeline";
import { LeadList } from "./LeadList";
import { LeadModal } from "./LeadModal";
import { useCRMStore, type Lead } from "@/lib/store/crm.store";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "NEW_LEAD", label: "New Lead" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

interface CRMContentProps {
  canDelete: boolean;
}

export function CRMContent({ canDelete }: CRMContentProps) {
  const { data, status, fetch } = useCRMStore();
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const searchParams = useSearchParams();
  const autoOpenDone = useRef(false);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!autoOpenDone.current && searchParams.get("new") === "1") {
      autoOpenDone.current = true;
      setEditingLead(null);
      setModalOpen(true);
    }
  }, [searchParams]);

  const loading = status === "idle" || status === "loading";

  const leads = (data?.leads ?? []).filter((l) => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCreate = () => { setEditingLead(null); setModalOpen(true); };
  const openEdit = (lead: Lead) => { setEditingLead(lead); setModalOpen(true); };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search leads…"
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
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setView("pipeline")}
            title="Pipeline view"
            className={`h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${
              view === "pipeline"
                ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)]"
            }`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            title="List view"
            className={`h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${
              view === "list"
                ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)]"
            }`}
          >
            <List size={15} />
          </button>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" /> New Lead
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : view === "pipeline" ? (
        <LeadPipeline leads={leads} onEditLead={openEdit} />
      ) : (
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
          <LeadList leads={leads} onEdit={openEdit} canDelete={canDelete} />
        </div>
      )}

      <LeadModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingLead(null); }}
        lead={editingLead}
      />
    </>
  );
}
