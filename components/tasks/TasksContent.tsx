"use client";

import { useEffect, useState } from "react";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TaskBoard } from "./TaskBoard";
import { TaskModal } from "./TaskModal";
import { useTasksStore, type TaskSummary } from "@/lib/store/tasks.store";
import { formatRelative } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const STATUS_BADGE: Record<string, string> = {
  BACKLOG: "draft", TODO: "draft", IN_PROGRESS: "in-progress",
  IN_REVIEW: "sent", CLIENT_REVIEW: "sent", COMPLETED: "active", BLOCKED: "lost",
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "var(--color-neutral-400)", MEDIUM: "var(--color-info-400)",
  HIGH: "var(--color-warning-500)", URGENT: "var(--color-danger-500)",
};

interface TasksContentProps {
  canCreate: boolean;
  myEmployeeId?: string;
}

export function TasksContent({ canCreate, myEmployeeId }: TasksContentProps) {
  const { data, status, fetch } = useTasksStore();
  const [view, setView] = useState<"board" | "list">("board");
  const [tab, setTab] = useState<"my" | "all">("my");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskSummary | null>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const loading = status === "idle" || status === "loading";

  const tasks = (data?.tasks ?? []).filter((t) => {
    if (tab === "my" && myEmployeeId && t.assignee?.id !== myEmployeeId) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.project?.name.toLowerCase().includes(q);
    }
    return true;
  });

  const openCreate = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit = (t: TaskSummary) => { setEditingTask(t); setModalOpen(true); };

  return (
    <>
      {/* Tab row */}
      <div className="flex items-center gap-1 border-b border-[var(--border-default)] mb-5">
        {(["my", "all"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t
                ? "border-[var(--interactive-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t === "my" ? "My Tasks" : "All Tasks"}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <div className="w-36">
          <Select value={filterStatus} onValueChange={setFilterStatus} options={STATUS_OPTIONS} placeholder="All statuses" />
        </div>
        <div className="w-36">
          <Select value={filterPriority} onValueChange={setFilterPriority} options={PRIORITY_OPTIONS} placeholder="All priorities" />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button type="button" onClick={() => setView("board")} className={`h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${view === "board" ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)]"}`}><LayoutGrid size={15} /></button>
          <button type="button" onClick={() => setView("list")} className={`h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${view === "list" ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)]"}`}><List size={15} /></button>
          {canCreate && (
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1" /> New Task
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : view === "board" ? (
        <TaskBoard tasks={tasks} onEditTask={openEdit} />
      ) : (
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
          {tasks.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-12">No tasks found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    {["Task", "Project", "Assignee", "Priority", "Status", "Due", ""].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {tasks.map((t) => {
                    const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED";
                    return (
                      <tr key={t.id} onClick={() => openEdit(t)} className="hover:bg-[var(--interactive-secondary-hover)] cursor-pointer transition-colors">
                        <td className="px-3 py-3">
                          <p className="font-medium text-[var(--text-primary)] text-sm">{t.title}</p>
                          <p className="text-xs text-[var(--text-tertiary)] font-mono">{t.taskId}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{t.project?.name ?? "—"}</td>
                        <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">
                          {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_COLOR[t.priority] }} />
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={STATUS_BADGE[t.status] as never || "default"}>
                            {t.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className={`px-3 py-3 text-xs whitespace-nowrap ${overdue ? "text-[var(--color-danger-500)]" : "text-[var(--text-tertiary)]"}`}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        task={editingTask}
      />
    </>
  );
}
