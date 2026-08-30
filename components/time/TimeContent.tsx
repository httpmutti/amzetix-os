"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Play, Square, Plus, Trash2, Clock, Users, BarChart3, StopCircle, PlayCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, InputLabel } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateTimeInput } from "@/components/ui/datetime-input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/utils";
import { useTimeStore } from "@/lib/store/time.store";
import { useProjectsStore } from "@/lib/store/projects.store";
import { useTasksStore } from "@/lib/store/tasks.store";
import { useTeamStore } from "@/lib/store/team.store";
import type { TimeEntry } from "@/lib/store/time.store";

interface ActiveEmployee {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  position?: string | null;
}

interface ActiveEntry {
  id: string;
  startTime: string;
  description?: string | null;
  employee: ActiveEmployee;
  project?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;
}

interface WeeklySummary {
  employee: ActiveEmployee;
  totalMinutes: number;
  totalHours: number;
  shortfall: number;
  meetsTarget: boolean;
}

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  summary: WeeklySummary[];
}

interface MonthlyData {
  month: string;
  elapsedWorkingDays: number;
  targetMinutes: number;
  summary: WeeklySummary[];
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatLiveDuration(startTime: string) {
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return [h > 0 ? String(h).padStart(2, "0") : null, String(m).padStart(2, "0"), String(s).padStart(2, "0")]
    .filter(Boolean).join(":");
}

function groupByDay(entries: TimeEntry[]) {
  const groups: Record<string, TimeEntry[]> = {};
  for (const e of entries) {
    const day = new Date(e.startTime).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  }
  return groups;
}

interface TimeContentProps {
  canTrack: boolean;
  canAdmin?: boolean;
}

export function TimeContent({ canTrack, canAdmin }: TimeContentProps) {
  const { entries, active, status, fetch, setActive, mutateEntries } = useTimeStore();
  const { data: projectsData, fetch: fetchProjects } = useProjectsStore();
  const { data: tasksData, fetch: fetchTasks } = useTasksStore();
  const { data: teamData, fetch: fetchTeam } = useTeamStore();

  const [liveTime, setLiveTime] = useState("");
  const [timerProject, setTimerProject] = useState("");
  const [timerTask, setTimerTask] = useState("");
  const [timerDesc, setTimerDesc] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval>>(null);

  // Admin panel state
  const [adminView, setAdminView] = useState<"active" | "weekly">("active");
  const [activeEntries, setActiveEntries] = useState<ActiveEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminStartOpen, setAdminStartOpen] = useState(false);
  const [adminStoppingId, setAdminStoppingId] = useState<string | null>(null);
  // Stop modal with manual end time
  const [stopModalEntry, setStopModalEntry] = useState<ActiveEntry | null>(null);
  const [stopModalTime, setStopModalTime] = useState("");

  const fetchAdminActive = useCallback(async () => {
    if (!canAdmin) return;
    setAdminLoading(true);
    try {
      const res = await window.fetch("/api/time/admin");
      const json = await res.json();
      setActiveEntries(json.data ?? []);
    } finally {
      setAdminLoading(false);
    }
  }, [canAdmin]);

  const fetchAdminWeekly = useCallback(async () => {
    if (!canAdmin) return;
    setAdminLoading(true);
    try {
      const res = await window.fetch("/api/time/admin?view=weekly");
      const json = await res.json();
      setWeeklyData(json);
    } finally {
      setAdminLoading(false);
    }
  }, [canAdmin]);

  useEffect(() => { fetch(); fetchProjects(); fetchTasks(); if (canAdmin) fetchTeam(); }, [fetch, fetchProjects, fetchTasks, fetchTeam, canAdmin]);

  // Poll active timer every 30s
  useEffect(() => {
    const poll = setInterval(() => { fetch(); }, 30000);
    return () => clearInterval(poll);
  }, [fetch]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (active) {
      const tick = () => setLiveTime(formatLiveDuration(active.startTime));
      tick();
      tickRef.current = setInterval(tick, 1000);
    } else {
      setLiveTime("");
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [active?.id]);

  useEffect(() => {
    if (!canAdmin) return;
    if (adminView === "active") fetchAdminActive();
    else fetchAdminWeekly();
  }, [adminView, canAdmin, fetchAdminActive, fetchAdminWeekly]);

  // Poll active every 15s
  useEffect(() => {
    if (!canAdmin || adminView !== "active") return;
    const id = setInterval(fetchAdminActive, 15000);
    return () => clearInterval(id);
  }, [canAdmin, adminView, fetchAdminActive]);

  const adminStopEmployee = async (employeeId: string, endTime?: string) => {
    setAdminStoppingId(employeeId);
    try {
      await window.fetch("/api/time/admin?action=stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, ...(endTime ? { endTime } : {}) }),
      });
      toast.success("Timer stopped");
      fetchAdminActive();
    } catch {
      toast.error("Failed to stop timer");
    } finally {
      setAdminStoppingId(null);
      setStopModalEntry(null);
    }
  };

  const openStopModal = (entry: ActiveEntry) => {
    setStopModalEntry(entry);
    const now = new Date().toISOString().slice(0, 16);
    setStopModalTime(now);
  };

  const projects = (projectsData?.projects ?? []).map((p) => ({ value: p.id, label: `${p.projectId} — ${p.name}` }));
  const tasks = (tasksData?.tasks ?? []).map((t) => ({ value: t.id, label: `${t.taskId} — ${t.title}` }));

  const loading = status === "idle" || status === "loading";

  const startTimer = async () => {
    if (!canTrack) return;
    setStarting(true);
    try {
      const res = await window.fetch("/api/time/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: timerProject || undefined, taskId: timerTask || undefined, description: timerDesc || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setActive(json.data);
      toast.success("Timer started");
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to start timer");
    } finally {
      setStarting(false);
    }
  };

  const stopTimer = async () => {
    setStopping(true);
    try {
      const res = await window.fetch("/api/time/stop", { method: "POST" });
      const json = await res.json();
      setActive(null);
      const stopped: TimeEntry | null = json.data ?? null;
      if (stopped) mutateEntries((list) => [stopped, ...list]);
      toast.success("Timer stopped");
    } catch {
      toast.error("Failed to stop timer");
    } finally {
      setStopping(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this time entry?")) return;
    await window.fetch(`/api/time/${id}`, { method: "DELETE" });
    toast.success("Entry deleted");
    mutateEntries((list) => list.filter((e) => e.id !== id));
  };

  const groups = groupByDay(entries.filter((e) => e.endTime));

  return (
    <>
      {/* ── Admin Panel ── */}
      {canAdmin && (
        <div className="mb-6 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1 bg-[var(--surface-page)] p-1 rounded-lg border border-[var(--border-default)]">
              <button
                onClick={() => setAdminView("active")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${adminView === "active" ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)] shadow-xs" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-hover-bg)]"}`}
              >
                <Users size={12} /> Active Now ({activeEntries.length})
              </button>
              <button
                onClick={() => setAdminView("weekly")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${adminView === "weekly" ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)] shadow-xs" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-hover-bg)]"}`}
              >
                <BarChart3 size={12} /> This Week
              </button>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="!bg-[var(--color-neutral-200)] hover:!bg-[var(--color-neutral-300)] border border-[var(--border-default)] !text-[var(--text-primary)] font-medium"
              onClick={() => setAdminStartOpen(true)}
            >
              <PlayCircle size={13} className="mr-1" /> Start for Employee
            </Button>
          </div>

          {adminView === "active" && (
            <div className="divide-y divide-[var(--border-subtle)]">
              {adminLoading && activeEntries.length === 0 && (
                <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              )}
              {!adminLoading && activeEntries.length === 0 && (
                <div className="py-10 text-center">
                  <Users size={28} className="text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">No employees are currently clocked in</p>
                </div>
              )}
              {activeEntries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)] border border-[var(--border-default)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] flex-shrink-0">
                    {entry.employee.firstName[0]}{entry.employee.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {entry.employee.firstName} {entry.employee.lastName}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {entry.description ?? entry.task?.title ?? entry.project?.name ?? "Working…"}
                      {entry.project ? ` · ${entry.project.name}` : ""}
                    </p>
                  </div>
                  <div className="font-mono text-sm font-semibold text-[var(--color-success-500)] min-w-[72px] text-right">
                    {formatLiveDuration(entry.startTime)}
                  </div>
                  <button
                    onClick={() => openStopModal(entry)}
                    disabled={adminStoppingId === entry.employee.id}
                    title="Stop timer"
                    className="text-[var(--color-danger-500)] hover:opacity-70 transition-opacity ml-2"
                  >
                    <StopCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {adminView === "weekly" && (
            <div>
              {weeklyData && (
                <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-hover)]">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Week: {new Date(weeklyData.weekStart).toLocaleDateString("en", { month: "short", day: "numeric" })} → {new Date(weeklyData.weekEnd).toLocaleDateString("en", { month: "short", day: "numeric" })} · Target: 45 hrs / week
                  </p>
                </div>
              )}
              <div className="divide-y divide-[var(--border-subtle)]">
                {adminLoading && !weeklyData && (
                  <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
                )}
                {weeklyData?.summary.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">No time tracked this week</p>
                  </div>
                )}
                {(weeklyData?.summary ?? []).map(row => {
                  const pct = Math.min(100, (row.totalMinutes / (45 * 60)) * 100);
                  const hh = Math.floor(row.totalMinutes / 60);
                  const mm = row.totalMinutes % 60;
                  return (
                    <div key={row.employee.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)] border border-[var(--border-default)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] flex-shrink-0">
                        {row.employee.firstName[0]}{row.employee.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {row.employee.firstName} {row.employee.lastName}
                          </p>
                          <span className={`font-mono text-xs font-semibold ${row.meetsTarget ? "text-[var(--color-success-500)]" : "text-[var(--color-warning-500)]"}`}>
                            {hh}h {mm}m
                          </span>
                        </div>
                        <div className="h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${row.meetsTarget ? "bg-[var(--color-success-500)]" : "bg-[var(--color-warning-500)]"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {!row.meetsTarget && (
                          <p className="text-xs text-[var(--color-warning-500)] mt-0.5">
                            {Math.floor(row.shortfall / 60)}h {row.shortfall % 60}m below target — Rs. 500 deduction risk
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {canTrack && !canAdmin && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <Input
                placeholder={active ? (active.description ?? "Running…") : "What are you working on?"}
                value={timerDesc}
                onChange={(e) => setTimerDesc(e.target.value)}
                disabled={!!active}
              />
            </div>
            <div className="w-44">
              <Select value={timerProject} onValueChange={setTimerProject} options={[{ value: "", label: "No project" }, ...projects]} disabled={!!active} />
            </div>
            <div className="w-48">
              <Select value={timerTask} onValueChange={setTimerTask} options={[{ value: "", label: "No task" }, ...tasks]} disabled={!!active} />
            </div>

            {active ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-semibold text-[var(--text-primary)] tabular-nums min-w-[80px]">{liveTime}</span>
                <Button variant="primary" size="sm" loading={stopping} onClick={stopTimer}>
                  <Square size={13} className="mr-1" fill="currentColor" /> Stop
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" loading={starting} onClick={startTimer}>
                  <Play size={13} className="mr-1" fill="currentColor" /> Start
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setManualOpen(true)}>
                  <Plus size={13} className="mr-1" /> Manual
                </Button>
              </div>
            )}
          </div>

          {active && (
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              Started {formatRelative(active.startTime)}
              {active.project ? ` · ${active.project.name}` : ""}
              {active.task ? ` · ${active.task.title}` : ""}
            </p>
          )}
        </div>
      )}

      {!canAdmin && loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !canAdmin && Object.keys(groups).length === 0 ? (
        <div className="text-center py-16">
          <Clock size={32} className="text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">No time entries yet</p>
        </div>
      ) : !canAdmin ? (
        <div className="space-y-4">
          {Object.entries(groups).map(([day, dayEntries]) => {
            const dayTotal = dayEntries.reduce((s, e) => s + (e.duration ?? 0), 0);
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    {new Date(day).toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)] tabular-nums">{formatDuration(dayTotal)}</span>
                </div>
                <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden divide-y divide-[var(--border-subtle)]">
                  {dayEntries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-4 py-2.5 group">
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{e.description ?? e.task?.title ?? "General"}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {e.project?.name ?? "—"}
                          {e.endTime ? ` · ${new Date(e.startTime).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })} → ${new Date(e.endTime).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
                          {e.duration ? formatDuration(e.duration) : "—"}
                        </span>
                        {canTrack && (
                          <button type="button" onClick={() => deleteEntry(e.id)} className="h-6 w-6 flex items-center justify-center rounded text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-danger-500)] transition-all cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Admin stop timer modal */}
      {stopModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-xl p-6 w-80 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Stop Timer — {stopModalEntry.employee.firstName} {stopModalEntry.employee.lastName}
            </h3>
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">End time</p>
              <DateTimeInput value={stopModalTime} onChange={e => setStopModalTime(e.target.value)} />
              <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">Set a specific end time or leave as now</p>
            </div>
            <div className="flex gap-2 justify-end border-t border-[var(--border-default)] pt-3">
              <Button variant="ghost" size="sm" onClick={() => setStopModalEntry(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                loading={adminStoppingId === stopModalEntry.employee.id}
                onClick={() => adminStopEmployee(stopModalEntry.employee.id, stopModalTime || undefined)}
              >
                Stop Timer
              </Button>
            </div>
          </div>
        </div>
      )}

      <ManualEntryModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        projects={projects}
        tasks={tasks}
        onSaved={() => { useTimeStore.getState().invalidate(); useTimeStore.getState().fetch(); }}
      />

      {canAdmin && (
        <AdminStartModal
          open={adminStartOpen}
          onClose={() => setAdminStartOpen(false)}
          employees={(Array.isArray(teamData) ? teamData : []).map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
          projects={projects}
          tasks={tasks}
          onSaved={fetchAdminActive}
        />
      )}
    </>
  );
}

function AdminStartModal({
  open, onClose, employees, projects, tasks, onSaved
}: {
  open: boolean;
  onClose: () => void;
  employees: { value: string; label: string }[];
  projects: { value: string; label: string }[];
  tasks: { value: string; label: string }[];
  onSaved: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [saving, setSaving] = useState(false);

  const now = () => new Date().toISOString().slice(0, 16);

  const save = async () => {
    if (!employeeId) { toast.error("Select an employee"); return; }
    setSaving(true);
    try {
      const res = await window.fetch("/api/time/admin?action=start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          startTime: startTime || now(),
          projectId: projectId || undefined,
          taskId: taskId || undefined,
          description: description || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Timer started");
      onSaved();
      onClose();
      setEmployeeId(""); setDescription(""); setProjectId(""); setTaskId(""); setStartTime("");
    } catch {
      toast.error("Failed to start timer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Start Timer for Employee" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button variant="primary" loading={saving} onClick={save} type="button">Start Timer</Button>
      </>}
    >
      <div className="space-y-3">
        <div>
          <InputLabel>Employee <span className="text-[var(--color-danger-500)]">*</span></InputLabel>
          <Select value={employeeId} onValueChange={setEmployeeId} options={[{ value: "", label: "Select employee…" }, ...employees]} />
        </div>
        <div>
          <InputLabel>Description</InputLabel>
          <Input placeholder="What are they working on?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <InputLabel>Project</InputLabel>
          <Select value={projectId} onValueChange={setProjectId} options={[{ value: "", label: "No project" }, ...projects]} />
        </div>
        <div>
          <InputLabel>Task</InputLabel>
          <Select value={taskId} onValueChange={setTaskId} options={[{ value: "", label: "No task" }, ...tasks]} />
        </div>
        <div>
          <InputLabel>Start Time (leave blank for now)</InputLabel>
          <DateTimeInput value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function ManualEntryModal({
  open, onClose, projects, tasks, onSaved
}: {
  open: boolean;
  onClose: () => void;
  projects: { value: string; label: string }[];
  tasks: { value: string; label: string }[];
  onSaved: () => void;
}) {
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!startTime || !endTime) { toast.error("Start and end time required"); return; }
    setSaving(true);
    try {
      const res = await window.fetch("/api/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description || undefined, projectId: projectId || undefined, taskId: taskId || undefined, startTime, endTime }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const created: TimeEntry = json.data ?? json;
      useTimeStore.getState().mutateEntries((list) => [created, ...list]);
      toast.success("Time entry added");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to add entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Time Entry" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button variant="primary" loading={saving} onClick={save} type="button">Add Entry</Button>
      </>}
    >
      <div className="space-y-3">
        <div>
          <InputLabel>Description</InputLabel>
          <Input placeholder="What did you work on?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <InputLabel>Project</InputLabel>
          <Select value={projectId} onValueChange={setProjectId} options={[{ value: "", label: "No project" }, ...projects]} />
        </div>
        <div>
          <InputLabel>Task</InputLabel>
          <Select value={taskId} onValueChange={setTaskId} options={[{ value: "", label: "No task" }, ...tasks]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputLabel>Start</InputLabel>
            <DateTimeInput value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <InputLabel>End</InputLabel>
            <DateTimeInput value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
