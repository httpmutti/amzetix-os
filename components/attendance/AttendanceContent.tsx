"use client";

import { useCallback, useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, LogIn, LogOut, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const ALL_PAGE_SIZE = 15;

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  totalMinutes?: number | null;
  lateMinutes?: number | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string | null;
  };
}

interface TodayStatus {
  id?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-[var(--status-active-bg)] text-[var(--status-active-text)]",
  LATE: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  ABSENT: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)]",
  HALF_DAY: "bg-[var(--status-paused-bg)] text-[var(--status-paused-text)]",
  PAID_LEAVE: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  UNPAID_LEAVE: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  WORK_FROM_HOME: "bg-[var(--interactive-primary-bg)] text-[var(--text-primary)]",
};

function CalendarDot({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, string> = {
    PRESENT: "bg-[var(--color-success-500)]",
    LATE: "bg-[var(--color-warning-500)]",
    ABSENT: "bg-[var(--color-danger-500)]",
    HALF_DAY: "bg-[var(--color-warning-400)]",
    PAID_LEAVE: "bg-[var(--color-info-400,#60a5fa)]",
    UNPAID_LEAVE: "bg-[var(--color-neutral-400)]",
    WORK_FROM_HOME: "bg-[var(--interactive-primary)]",
  };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${map[status] ?? "bg-[var(--border-default)]"}`} />;
}

interface AdminEmployeeToday {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string | null;
  };
  today: {
    id: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status: string;
    totalMinutes?: number | null;
  } | null;
}

interface Props {
  canViewAll: boolean;
  canCheckIn: boolean;
}

export function AttendanceContent({ canViewAll, canCheckIn }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [summary, setSummary] = useState<{ records: AttendanceRecord[]; present: number; late: number; absent: number; totalMinutes: number } | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [allPage, setAllPage] = useState(1);

  // Admin today panel
  const [adminToday, setAdminToday] = useState<AdminEmployeeToday[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminActingId, setAdminActingId] = useState<string | null>(null);

  const loadOwn = useCallback(async () => {
    const [todayRes, summaryRes] = await Promise.all([
      window.fetch("/api/attendance/today"),
      window.fetch(`/api/attendance/monthly?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`),
    ]);
    const [todayData, summaryData] = await Promise.all([todayRes.json(), summaryRes.json()]);
    setTodayStatus(todayData.data ?? null);
    setSummary(summaryData.data ?? null);
  }, [currentMonth]);

  const loadAll = useCallback(async () => {
    if (!canViewAll) return;
    const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const res = await window.fetch(`/api/attendance?from=${from}&to=${to}&limit=200`);
    const json = await res.json();
    setAllRecords(json.data ?? []);
  }, [canViewAll, currentMonth]);

  const loadAdminToday = useCallback(async () => {
    if (!canViewAll) return;
    setAdminLoading(true);
    const res = await window.fetch("/api/attendance/admin");
    const json = await res.json();
    setAdminToday(json.data ?? []);
    setAdminLoading(false);
  }, [canViewAll]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadOwn(), loadAll(), loadAdminToday()]).finally(() => setLoading(false));
  }, [loadOwn, loadAll, loadAdminToday]);

  const handleAdminAction = async (employeeId: string, action: "check-in" | "check-out", manualTime?: string) => {
    setAdminActingId(employeeId);
    try {
      const res = await window.fetch("/api/attendance/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, action, manualTime }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(action === "check-in" ? "Employee clocked in" : "Employee clocked out");
        // Update local state immediately
        setAdminToday(prev => prev.map(e =>
          e.employee.id === employeeId ? { ...e, today: json.data } : e
        ));
        loadAll(); // refresh the all-employees table too
      } else {
        toast.error(json.error ?? "Action failed");
      }
    } finally {
      setAdminActingId(null);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    const res = await window.fetch("/api/attendance/check-in", { method: "POST" });
    const json = await res.json();
    if (res.ok) { toast.success("Checked in successfully"); setTodayStatus(json.data); }
    else toast.error(json.error ?? "Check-in failed");
    setActionLoading(false);
    loadOwn();
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    const res = await window.fetch("/api/attendance/check-out", { method: "POST" });
    const json = await res.json();
    if (res.ok) { toast.success("Checked out successfully"); setTodayStatus(json.data); }
    else toast.error(json.error ?? "Check-out failed");
    setActionLoading(false);
    loadOwn();
  };

  // Build calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  // Map date → status from summary records
  const recordByDate = new Map<string, string>();
  (summary?.records ?? []).forEach((r) => {
    recordByDate.set(r.date.slice(0, 10), r.status);
  });

  useEffect(() => setAllPage(1), [allRecords]);

  const allTotalPages = Math.ceil(allRecords.length / ALL_PAGE_SIZE);
  const allPaged = allRecords.slice((allPage - 1) * ALL_PAGE_SIZE, allPage * ALL_PAGE_SIZE);

  const checkedIn = !!todayStatus?.checkIn;
  const checkedOut = !!todayStatus?.checkOut;

  return (
    <div className="flex flex-col gap-6">
      {/* Check-in widget — only for non-admin employees */}
      {canCheckIn && !canViewAll && (
        <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{format(today, "EEEE, MMMM d, yyyy")}</p>
            {checkedIn ? (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Checked in at {format(new Date(todayStatus!.checkIn!), "HH:mm")}
                {checkedOut ? ` · Checked out at ${format(new Date(todayStatus!.checkOut!), "HH:mm")}` : ""}
                {todayStatus?.status && (
                  <span className={`ml-2 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[todayStatus.status] ?? ""}`}>
                    {todayStatus.status}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Not checked in yet</p>
            )}
          </div>
          <div className="flex gap-2">
            {!checkedIn && (
              <Button onClick={handleCheckIn} loading={actionLoading} size="sm">
                <LogIn size={13} /> Check In
              </Button>
            )}
            {checkedIn && !checkedOut && (
              <Button onClick={handleCheckOut} loading={actionLoading} variant="outline" size="sm">
                <LogOut size={13} /> Check Out
              </Button>
            )}
            {checkedIn && checkedOut && (
              <span className="text-xs text-[var(--text-secondary)] self-center">Done for today</span>
            )}
          </div>
        </div>
      )}

      {/* ── Admin: Today's employee clock panel ── */}
      {canViewAll && (
        <AdminTodayPanel
          employees={adminToday}
          loading={adminLoading}
          actingId={adminActingId}
          onAction={handleAdminAction}
        />
      )}

      {/* Stats row — personal stats, hidden for admins who see full team data */}
      {!canViewAll && !loading && summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Present", summary.present, "var(--status-active-text)"],
            ["Late", summary.late, "var(--status-pending-text)"],
            ["Absent", summary.absent, "var(--status-cancelled-text)"],
            ["Hours", summary.totalMinutes ? `${Math.floor(summary.totalMinutes / 60)}h` : "0h", "var(--text-primary)"],
          ].map(([label, val, color]) => (
            <div key={String(label)} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-3 text-center">
              <p className="text-2xl font-bold" style={{ color: `${color}` }}>{val}</p>
              <p className="text-xs text-[var(--text-secondary)]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar — personal attendance calendar, hidden for admins */}
      {!canViewAll && <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{format(currentMonth, "MMMM yyyy")}</h3>
          <button
            type="button"
            onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <Skeleton className="h-48 rounded-[var(--radius-md)]" />
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-medium text-[var(--text-tertiary)]">{d}</div>
            ))}
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const isToday = key === format(today, "yyyy-MM-dd");
              const status = recordByDate.get(key);
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] p-1.5 text-xs transition-colors ${
                    isToday ? "ring-1 ring-[var(--interactive-primary)]" : ""
                  } ${isSameMonth(day, currentMonth) ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}
                >
                  <span className={`${isToday ? "font-bold" : ""}`}>{format(day, "d")}</span>
                  <CalendarDot status={status} />
                </div>
              );
            })}
          </div>
        )}
      </div>}

      {/* All employees table (HR/Admin view) */}
      {canViewAll && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-3">
            <Users size={14} className="text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">All Employees — {format(currentMonth, "MMMM yyyy")}</h3>
          </div>
          {loading ? (
            <div className="p-4 flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : allRecords.length === 0 ? (
            <p className="p-6 text-center text-sm text-[var(--text-secondary)]">No attendance records for this period.</p>
          ) : (
            <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    {["Employee","Date","Check In","Check Out","Hours","Status"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPaged.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                      <td className="px-4 py-2.5 text-[var(--text-primary)] font-medium">
                        {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{format(new Date(r.date), "MMM d, yyyy")}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.checkIn ? format(new Date(r.checkIn), "HH:mm") : "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.checkOut ? format(new Date(r.checkOut), "HH:mm") : "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.totalMinutes ? `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m` : "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[r.status] ?? ""}`}>
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-3">
              <Pagination page={allPage} totalPages={allTotalPages} total={allRecords.length} pageSize={ALL_PAGE_SIZE} onPageChange={setAllPage} />
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AdminTodayPanel ─────────────────────────────────────────────────────────

function AdminTodayPanel({
  employees, loading, actingId, onAction,
}: {
  employees: AdminEmployeeToday[];
  loading: boolean;
  actingId: string | null;
  onAction: (employeeId: string, action: "check-in" | "check-out", time?: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<{ employee: AdminEmployeeToday["employee"]; action: "check-in" | "check-out" } | null>(null);
  const [manualTime, setManualTime] = useState("");
  const [saving, setSaving] = useState(false);

  const open = (emp: AdminEmployeeToday["employee"], action: "check-in" | "check-out") => {
    setPending({ employee: emp, action });
    // Default to current time
    const now = new Date();
    setManualTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setModalOpen(true);
  };

  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    await onAction(pending.employee.id, pending.action, manualTime);
    setSaving(false);
    setModalOpen(false);
  };

  const checkedIn = (row: AdminEmployeeToday) => !!row.today?.checkIn;
  const checkedOut = (row: AdminEmployeeToday) => !!row.today?.checkOut;

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-3">
          <ShieldCheck size={14} className="text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Today's Attendance — Admin Override</h3>
          <span className="ml-1 text-xs text-[var(--text-tertiary)]">Clock in/out any employee manually</span>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
        ) : employees.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--text-secondary)]">No active employees found.</p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {employees.map(row => {
              const isIn = checkedIn(row);
              const isOut = checkedOut(row);
              const acting = actingId === row.employee.id;
              return (
                <div key={row.employee.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)] border border-[var(--border-default)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] flex-shrink-0">
                    {row.employee.firstName[0]}{row.employee.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {row.employee.firstName} {row.employee.lastName}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {row.employee.position ?? "—"}
                      {isIn && row.today?.checkIn && ` · In: ${format(new Date(row.today.checkIn), "HH:mm")}`}
                      {isOut && row.today?.checkOut && ` · Out: ${format(new Date(row.today.checkOut), "HH:mm")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isIn && isOut ? (
                      <span className="text-xs text-[var(--color-success-500)] font-medium">Done for today</span>
                    ) : isIn ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => open(row.employee, "check-out")}
                        disabled={acting}
                      >
                        <LogOut size={11} /> Clock Out
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => open(row.employee, "check-in")}
                        disabled={acting}
                      >
                        <LogIn size={11} /> Clock In
                      </Button>
                    )}
                    {!isIn && !isOut && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">Not in</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm modal with manual time */}
      {modalOpen && pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--surface-card)] rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-xl p-6 w-80 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {pending.action === "check-in" ? "Clock In" : "Clock Out"} — {pending.employee.firstName} {pending.employee.lastName}
            </h3>
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                {pending.action === "check-in" ? "Check-in time" : "Check-out time"}
              </p>
              <input
                type="time"
                value={manualTime}
                onChange={e => setManualTime(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-input)] bg-[var(--surface-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
              />
              <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">Leave as current time or set a specific time</p>
            </div>
            <div className="flex gap-2 justify-end border-t border-[var(--border-default)] pt-3">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" loading={saving} onClick={confirm}>
                {pending?.action === "check-in" ? "Clock In" : "Clock Out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
