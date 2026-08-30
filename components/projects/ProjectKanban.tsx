"use client";

import { toast } from "sonner";
import Link from "next/link";
import { CalendarDays, Users, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProjectsStore, type ProjectSummary } from "@/lib/store/projects.store";
import { formatRelative } from "@/lib/utils";

const COLUMNS: { status: string; label: string; color: string }[] = [
  { status: "PLANNED",       label: "Planned",       color: "var(--color-neutral-400)" },
  { status: "ACTIVE",        label: "Active",         color: "var(--color-success-400)" },
  { status: "ON_HOLD",       label: "On Hold",        color: "var(--color-warning-400)" },
  { status: "IN_REVIEW",     label: "In Review",      color: "var(--color-info-400)" },
  { status: "COMPLETED",     label: "Completed",      color: "var(--color-success-600)" },
];

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "var(--color-neutral-400)",
  MEDIUM: "var(--color-info-400)",
  HIGH: "var(--color-warning-500)",
  URGENT: "var(--color-danger-500)",
};

function progressPct(project: ProjectSummary) {
  const total = project.tasks.length;
  if (!total) return 0;
  const done = project.tasks.filter((t) => t.status === "COMPLETED").length;
  return Math.round((done / total) * 100);
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const { invalidate } = useProjectsStore();
  const pct = progressPct(project);
  const overdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== "COMPLETED";

  const moveStatus = async (newStatus: string) => {
    const res = await window.fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      invalidate();
      useProjectsStore.getState().fetch();
    } else {
      toast.error("Failed to move project");
    }
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-3 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] transition-all group"
    >
      {/* Left accent + name */}
      <div className="flex items-start gap-2 mb-2">
        <span
          className="mt-1 h-2 w-2 rounded-full shrink-0"
          style={{ background: PRIORITY_COLOR[project.priority] }}
          title={`Priority: ${project.priority}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">{project.name}</p>
          <p className="text-xs text-[var(--text-tertiary)] truncate">{project.projectId}</p>
        </div>
      </div>

      {/* Client */}
      {project.client && (
        <p className="text-xs text-[var(--text-secondary)] mb-2.5 truncate">{project.client.companyName}</p>
      )}

      {/* Progress bar */}
      {project._count.tasks > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--text-tertiary)]">{pct}% done</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">{project.tasks.filter(t => t.status === "COMPLETED").length}/{project._count.tasks}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[var(--interactive-primary-bg)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? "var(--color-success-500)" : "var(--interactive-primary)",
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[var(--border-subtle)] pt-2 mt-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          {project._count.members > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
              <Users size={10} /> {project._count.members}
            </span>
          )}
          {project.estimatedHours && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
              <Clock size={10} /> {Number(project.estimatedHours)}h
            </span>
          )}
          {overdue && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--color-danger-500)]">
              <AlertCircle size={10} /> Overdue
            </span>
          )}
        </div>
        {project.dueDate && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
            <CalendarDays size={10} />
            {new Date(project.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </Link>
  );
}

interface ProjectKanbanProps {
  projects: ProjectSummary[];
}

export function ProjectKanban({ projects }: ProjectKanbanProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "400px" }}>
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.status);

        return (
          <div key={col.status} className="flex-none w-[240px]">
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: col.color }} />
              <span className="text-xs font-semibold text-[var(--text-primary)]">{col.label}</span>
              <span
                className="text-[10px] font-semibold rounded-full px-1.5 py-0.5"
                style={{ background: "var(--interactive-primary-bg)", color: "var(--text-secondary)" }}
              >
                {colProjects.length}
              </span>
            </div>

            <div className="space-y-2">
              {colProjects.length === 0 ? (
                <div className="border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 text-center">
                  <p className="text-xs text-[var(--text-tertiary)]">No projects</p>
                </div>
              ) : (
                colProjects.map((p) => <ProjectCard key={p.id} project={p} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
