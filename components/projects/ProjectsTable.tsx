"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2, Edit2, ExternalLink, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProjectsStore, type ProjectSummary } from "@/lib/store/projects.store";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<string, string> = {
  PLANNED: "draft", ACTIVE: "active", ON_HOLD: "pending",
  IN_REVIEW: "in-progress", CLIENT_REVIEW: "sent",
  COMPLETED: "completed", CANCELLED: "lost",
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "var(--color-neutral-400)",
  MEDIUM: "var(--color-info-400)",
  HIGH: "var(--color-warning-500)",
  URGENT: "var(--color-danger-500)",
};

function progressPct(project: ProjectSummary) {
  const total = project.tasks.length;
  if (!total) return 0;
  return Math.round((project.tasks.filter((t) => t.status === "COMPLETED").length / total) * 100);
}

interface ProjectsTableProps {
  projects: ProjectSummary[];
  onEdit: (project: ProjectSummary) => void;
  canDelete: boolean;
}

export function ProjectsTable({ projects, onEdit, canDelete }: ProjectsTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { invalidate } = useProjectsStore();

  useEffect(() => setPage(1), [projects]);

  const totalPages = Math.ceil(projects.length / PAGE_SIZE);
  const paged = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (project: ProjectSummary) => {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    setDeleting(project.id);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Project deleted");
      invalidate();
      useProjectsStore.getState().fetch();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpen size={32} className="text-[var(--text-tertiary)] mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">No projects found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)]">
            {["Project", "Client", "Status", "Priority", "Progress", "Budget", "Due", ""].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {paged.map((p) => {
            const pct = progressPct(p);
            return (
              <tr key={p.id} className="hover:bg-[var(--interactive-secondary-hover)] transition-colors group">
                <td className="px-3 py-3">
                  <Link href={`/projects/${p.id}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--text-brand)] flex items-center gap-1.5">
                    {p.name}
                    <ExternalLink size={11} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                  </Link>
                  <p className="text-xs text-[var(--text-tertiary)] font-mono">{p.projectId}</p>
                </td>
                <td className="px-3 py-3 text-[var(--text-secondary)] text-xs">{p.client?.companyName ?? "—"}</td>
                <td className="px-3 py-3">
                  <Badge variant={STATUS_BADGE[p.status] as never || "default"}>
                    {p.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: PRIORITY_DOT[p.priority] }} />
                    {p.priority}
                  </span>
                </td>
                <td className="px-3 py-3 min-w-[100px]">
                  {p._count.tasks > 0 ? (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-[var(--text-tertiary)]">{pct}%</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-[var(--interactive-primary-bg)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--interactive-primary)" }} />
                      </div>
                    </div>
                  ) : <span className="text-xs text-[var(--text-tertiary)]">—</span>}
                </td>
                <td className="px-3 py-3 text-[var(--text-secondary)] tabular-nums">
                  {p.budget ? formatCurrency(p.budget, p.currency, true) : "—"}
                </td>
                <td className="px-3 py-3 text-[var(--text-tertiary)] whitespace-nowrap text-xs">
                  {p.dueDate ? new Date(p.dueDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => onEdit(p)} className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                      <Edit2 size={13} />
                    </button>
                    {canDelete && (
                      <button type="button" onClick={() => handleDelete(p)} disabled={deleting === p.id} className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--color-danger-500)] transition-colors cursor-pointer">
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
      <Pagination page={page} totalPages={totalPages} total={projects.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
