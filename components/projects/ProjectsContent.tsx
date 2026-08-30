"use client";

import { useEffect, useState } from "react";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectKanban } from "./ProjectKanban";
import { ProjectsTable } from "./ProjectsTable";
import { ProjectModal } from "./ProjectModal";
import { useProjectsStore, type ProjectSummary } from "@/lib/store/projects.store";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface ProjectsContentProps {
  canCreate: boolean;
  canDelete: boolean;
}

export function ProjectsContent({ canCreate, canDelete }: ProjectsContentProps) {
  const { data, status, fetch } = useProjectsStore();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const loading = status === "idle" || status === "loading";

  const projects = (data?.projects ?? []).filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.projectId.toLowerCase().includes(q) || p.client?.companyName.toLowerCase().includes(q);
    }
    return true;
  });

  const openCreate = () => { setEditingProject(null); setModalOpen(true); };
  const openEdit = (p: ProjectSummary) => { setEditingProject(p); setModalOpen(true); };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="w-40">
          <Select value={filterStatus} onValueChange={setFilterStatus} options={STATUS_OPTIONS} placeholder="All statuses" />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${view === "kanban" ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)]"}`}
          ><LayoutGrid size={15} /></button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${view === "table" ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)]"}`}
          ><List size={15} /></button>
          {canCreate && (
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1" /> New Project
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : view === "kanban" ? (
        <ProjectKanban projects={projects} />
      ) : (
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
          <ProjectsTable projects={projects} onEdit={openEdit} canDelete={canDelete} />
        </div>
      )}

      <ProjectModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProject(null); }}
        project={editingProject}
      />
    </>
  );
}
