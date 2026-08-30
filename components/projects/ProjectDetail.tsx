"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Trash2, Clock, Users, CheckSquare, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Input, InputLabel } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { formatCurrency, formatRelative } from "@/lib/utils";
import { useProjectsStore } from "@/lib/store/projects.store";
import { useTasksStore, type TaskSummary } from "@/lib/store/tasks.store";
import { ProjectModal } from "./ProjectModal";
import type { ProjectSummary } from "@/lib/store/projects.store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  role: string | null;
  employee: { id: string; firstName: string; lastName: string; position: string | null; profileImage: string | null };
}

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  isManual: boolean;
  employee: { id: string; firstName: string; lastName: string };
  task: { id: string; title: string } | null;
}

interface ProjectFull {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  startDate: string | null;
  budget: number | null;
  currency: string;
  estimatedHours: number | null;
  client: { id: string; companyName: string } | null;
  tasks: TaskSummary[];
  members: Member[];
  timeEntries: TimeEntry[];
}

const STATUS_BADGE: Record<string, string> = {
  PLANNED: "draft", ACTIVE: "active", ON_HOLD: "pending",
  IN_REVIEW: "in-progress", CLIENT_REVIEW: "sent",
  COMPLETED: "completed", CANCELLED: "lost",
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "var(--color-neutral-400)", MEDIUM: "var(--color-info-400)",
  HIGH: "var(--color-warning-500)", URGENT: "var(--color-danger-500)",
};

// ─── ProjectDetail ────────────────────────────────────────────────────────────

interface ProjectDetailProps {
  projectId: string;
  canEdit: boolean;
}

export function ProjectDetail({ projectId, canEdit }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");
  const [editOpen, setEditOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskSummary | null>(null);
  const { invalidate: invalidateProjects } = useProjectsStore();
  const { invalidate: invalidateTasks } = useTasksStore();

  const loadProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();
      setProject(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProject(); }, [projectId]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!project) return <p className="text-sm text-[var(--text-tertiary)] text-center py-20">Project not found.</p>;

  const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
  const totalTasks = project.tasks.length;
  const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalMinutes = project.timeEntries.reduce((s, e) => s + (e.duration ?? 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const tabs = [
    { id: "tasks", label: "Tasks", count: totalTasks },
    { id: "members", label: "Members", count: project.members.length },
    { id: "time", label: "Time Log", count: project.timeEntries.length },
  ];

  const openEditTask = (t: TaskSummary) => { setEditingTask(t); setTaskModalOpen(true); };
  const openCreateTask = () => { setEditingTask(null); setTaskModalOpen(true); };

  return (
    <>
      {/* Header */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">{project.name}</h1>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">{project.projectId}</span>
              <Badge variant={STATUS_BADGE[project.status] as never || "default"}>
                {project.status.replace(/_/g, " ")}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_DOT[project.priority] }} />
                {project.priority}
              </span>
            </div>
            {project.client && (
              <Link href={`/clients/${project.client.id}`} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-brand)]">
                {project.client.companyName}
              </Link>
            )}
            {project.description && <p className="text-sm text-[var(--text-secondary)] mt-1">{project.description}</p>}
          </div>
          {canEdit && <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>}
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="mb-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs text-[var(--text-tertiary)]">Progress</span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">{completedTasks}/{totalTasks} tasks · {pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--interactive-primary-bg)] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "var(--color-success-500)" : "var(--interactive-primary)" }} />
            </div>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[var(--border-subtle)]">
          {project.budget && (
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Budget</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(project.budget, project.currency)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Time Logged</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{totalHours}h</p>
          </div>
          {project.estimatedHours && (
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Est. Hours</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{Number(project.estimatedHours)}h</p>
            </div>
          )}
          {project.dueDate && (
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Due Date</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {new Date(project.dueDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === "tasks" && (
          <>
            <div className="flex justify-end mb-3">
              {canEdit && (
                <Button variant="secondary" size="sm" onClick={openCreateTask}>
                  <Plus size={13} className="mr-1" /> Add Task
                </Button>
              )}
            </div>
            <TaskBoard tasks={project.tasks as TaskSummary[]} onEditTask={openEditTask} compact />
          </>
        )}
        {activeTab === "members" && (
          <MembersTab project={project} canEdit={canEdit} onRefresh={loadProject} />
        )}
        {activeTab === "time" && (
          <TimeTab entries={project.timeEntries} totalHours={totalHours} />
        )}
      </div>

      {/* Modals */}
      <ProjectModal
        open={editOpen}
        onClose={() => { setEditOpen(false); invalidateProjects(); loadProject(); }}
        project={project as unknown as ProjectSummary}
      />
      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
          invalidateTasks();
          loadProject();
        }}
        task={editingTask}
        defaultProjectId={project.id}
      />
    </>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({ project, canEdit, onRefresh }: { project: ProjectFull; canEdit: boolean; onRefresh: () => void }) {
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.fetch("/api/team?limit=100").then(r => r.json()).then(json => {
      const emps = json.data ?? json.employees ?? [];
      const memberIds = new Set(project.members.map(m => m.employee.id));
      setEmployees(emps
        .filter((e: { id: string }) => !memberIds.has(e.id))
        .map((e: { id: string; firstName: string; lastName: string }) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })));
    }).catch(() => {});
  }, [project.members]);

  const addMember = async () => {
    if (!selectedEmp) return;
    setSaving(true);
    try {
      const res = await window.fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmp }),
      });
      if (!res.ok) throw new Error();
      toast.success("Member added");
      setSelectedEmp("");
      onRefresh();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      await window.fetch(`/api/projects/${project.id}/members/${memberId}`, { method: "DELETE" });
      toast.success("Member removed");
      onRefresh();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
      {canEdit && employees.length > 0 && (
        <div className="flex items-center gap-2 p-3 border-b border-[var(--border-default)]">
          <div className="flex-1">
            <Select value={selectedEmp} onValueChange={setSelectedEmp} options={[{ value: "", label: "Select team member…" }, ...employees]} />
          </div>
          <Button variant="secondary" size="sm" loading={saving} onClick={addMember} type="button">
            <Plus size={13} className="mr-1" /> Add
          </Button>
        </div>
      )}
      {project.members.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No members yet.</p>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          {project.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[var(--interactive-primary)] text-[var(--text-on-primary)] flex items-center justify-center text-xs font-bold">
                  {m.employee.firstName[0]}{m.employee.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{m.employee.firstName} {m.employee.lastName}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{m.role ?? m.employee.position ?? "Team Member"}</p>
                </div>
              </div>
              {canEdit && (
                <button type="button" onClick={() => removeMember(m.id)} className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-danger-500)] transition-all cursor-pointer">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Time tab ─────────────────────────────────────────────────────────────────

function TimeTab({ entries, totalHours }: { entries: TimeEntry[]; totalHours: string }) {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Time Log</h3>
        <span className="text-xs text-[var(--text-secondary)]">Total: <strong className="text-[var(--text-primary)]">{totalHours}h</strong></span>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No time entries yet.</p>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          {entries.map((e) => {
            const hrs = e.duration ? (e.duration / 60).toFixed(1) : "—";
            return (
              <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">{e.employee.firstName} {e.employee.lastName}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {e.task ? e.task.title : e.description ?? "General"} · {formatRelative(e.startTime)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--text-secondary)] tabular-nums">{hrs}h</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
