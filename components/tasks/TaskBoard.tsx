"use client";

import { toast } from "sonner";
import { CalendarDays, AlertCircle, CheckSquare } from "lucide-react";
import { useTasksStore, type TaskSummary } from "@/lib/store/tasks.store";

const COLUMNS: { status: string; label: string; color: string }[] = [
  { status: "BACKLOG",       label: "Backlog",       color: "var(--color-neutral-400)" },
  { status: "TODO",          label: "To Do",          color: "var(--color-info-400)" },
  { status: "IN_PROGRESS",   label: "In Progress",    color: "var(--color-warning-400)" },
  { status: "IN_REVIEW",     label: "In Review",      color: "var(--color-info-500)" },
  { status: "COMPLETED",     label: "Completed",      color: "var(--color-success-400)" },
  { status: "BLOCKED",       label: "Blocked",        color: "var(--color-danger-400)" },
];

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "var(--color-neutral-400)",
  MEDIUM: "var(--color-info-400)",
  HIGH: "var(--color-warning-500)",
  URGENT: "var(--color-danger-500)",
};

function Initials({ name }: { name: string }) {
  const parts = name.split(" ");
  return (
    <span className="h-5 w-5 rounded-full bg-[var(--interactive-primary)] text-[var(--text-on-primary)] flex items-center justify-center text-[9px] font-bold shrink-0">
      {parts[0]?.[0]}{parts[1]?.[0]}
    </span>
  );
}

function TaskCard({ task, onClick }: { task: TaskSummary; onClick: () => void }) {
  const { invalidate } = useTasksStore();
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
  const checklists = task.checklists ?? [];
  const checkDone = checklists.filter((c) => c.done).length;
  const checkTotal = checklists.length;

  const moveStatus = async (newStatus: string) => {
    const res = await window.fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      invalidate();
      useTasksStore.getState().fetch();
    } else {
      toast.error("Failed to update");
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-3 cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] transition-all"
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[task.priority] }} />
        <p className="text-sm font-medium text-[var(--text-primary)] leading-snug flex-1">{task.title}</p>
      </div>

      {task.project && (
        <p className="text-[10px] text-[var(--text-tertiary)] ml-3.5 mb-2 truncate">{task.project.name}</p>
      )}

      <div className="flex items-center justify-between mt-2 ml-3.5">
        <div className="flex items-center gap-2">
          {checkTotal > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
              <CheckSquare size={10} /> {checkDone}/{checkTotal}
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[10px] ${overdue ? "text-[var(--color-danger-500)]" : "text-[var(--text-tertiary)]"}`}>
              {overdue ? <AlertCircle size={10} /> : <CalendarDays size={10} />}
              {new Date(task.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        {task.assignee && (
          <Initials name={`${task.assignee.firstName} ${task.assignee.lastName}`} />
        )}
      </div>
    </div>
  );
}

interface TaskBoardProps {
  tasks: TaskSummary[];
  onEditTask: (task: TaskSummary) => void;
  compact?: boolean;
}

export function TaskBoard({ tasks, onEditTask, compact = false }: TaskBoardProps) {
  const columns = compact
    ? COLUMNS.filter((c) => !["BACKLOG", "BLOCKED"].includes(c.status))
    : COLUMNS;

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "300px" }}>
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className={compact ? "flex-none w-[200px]" : "flex-none w-[220px]"}>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: col.color }} />
              <span className="text-xs font-semibold text-[var(--text-primary)]">{col.label}</span>
              <span
                className="text-[10px] font-semibold rounded-full px-1.5 py-0.5"
                style={{ background: "var(--interactive-primary-bg)", color: "var(--text-secondary)" }}
              >
                {colTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {colTasks.length === 0 ? (
                <div className="border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 text-center">
                  <p className="text-xs text-[var(--text-tertiary)]">Empty</p>
                </div>
              ) : (
                colTasks.map((t) => <TaskCard key={t.id} task={t} onClick={() => onEditTask(t)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
