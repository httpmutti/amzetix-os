"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Edit2, Calendar, DollarSign, Clock, Briefcase, User } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeModal } from "./EmployeeModal";

const PAGE_SIZE = 10;

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  totalMinutes?: number | null;
  lateMinutes?: number | null;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string | null;
  leaveType: { name: string; isPaid: boolean };
  createdAt: string;
}

interface LeaveBalance {
  id: string;
  allocated: number;
  used: number;
  remaining: number;
  leaveType: { name: string };
}

interface SalaryHistory {
  id: string;
  baseSalary: number | string;
  currency: string;
  effectiveDate: string;
  notes?: string | null;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  phone?: string | null;
  status: string;
  employmentType: string;
  joiningDate?: string | null;
  baseSalary: number | string;
  currency: string;
  workingHours: number | string;
  address?: string | null;
  notes?: string | null;
  departmentId?: string | null;
  profileImage?: string | null;
  department?: { id: string; name: string } | null;
  user: { id: string; email: string; name: string | null; role: string };
  emergencyContact?: { name: string; phone: string; relation: string } | null;
  salaryHistory?: SalaryHistory[];
  _count?: { tasks: number; leaveRequests: number; timeEntries: number; projectMembers: number };
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-[var(--status-active-bg)] text-[var(--status-active-text)]",
  ON_LEAVE: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  SUSPENDED: "bg-[var(--status-paused-bg)] text-[var(--status-paused-text)]",
  TERMINATED: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)]",
};

const ATT_STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-[var(--status-active-bg)] text-[var(--status-active-text)]",
  LATE: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  ABSENT: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)]",
  HALF_DAY: "bg-[var(--status-paused-bg)] text-[var(--status-paused-text)]",
  PAID_LEAVE: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  UNPAID_LEAVE: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  WORK_FROM_HOME: "bg-[var(--status-info-bg,var(--color-info-100))] text-[var(--status-info-text,var(--color-info-700))]",
};

const LEAVE_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  APPROVED: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  REJECTED: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)]",
  CANCELLED: "bg-[var(--status-paused-bg)] text-[var(--status-paused-text)]",
};

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

interface Props {
  employeeId: string;
  canEdit: boolean;
  canViewSalary: boolean;
}

export function EmployeeDetail({ employeeId, canEdit, canViewSalary }: Props) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Attendance state
  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());
  const [attSummary, setAttSummary] = useState<{ records: AttendanceRecord[]; present: number; late: number; absent: number; wfh: number; totalMinutes: number } | null>(null);
  const [attLoading, setAttLoading] = useState(false);

  // Leave state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);

  // Pagination
  const [attPage, setAttPage] = useState(1);
  const [leavePage, setLeavePage] = useState(1);
  const [salaryPage, setSalaryPage] = useState(1);

  useEffect(() => {
    window.fetch(`/api/employees/${employeeId}`)
      .then(r => r.json())
      .then(d => { setEmployee(d.data); setLoading(false); });
  }, [employeeId]);

  useEffect(() => {
    if (activeTab === "attendance") loadAttendance();
    if (activeTab === "leave") loadLeave();
  }, [activeTab, attMonth, attYear]);

  const loadAttendance = async () => {
    setAttLoading(true);
    const res = await window.fetch(`/api/attendance/monthly?employeeId=${employeeId}&month=${attMonth}&year=${attYear}`);
    const json = await res.json();
    setAttSummary(json.data);
    setAttLoading(false);
  };

  const loadLeave = async () => {
    const [reqRes, balRes] = await Promise.all([
      window.fetch(`/api/leave?employeeId=${employeeId}&limit=50`),
      window.fetch(`/api/leave-balance?employeeId=${employeeId}`),
    ]);
    const [reqJson, balJson] = await Promise.all([reqRes.json(), balRes.json()]);
    setLeaveRequests(reqJson.data ?? []);
    setLeaveBalances(balJson.data ?? []);
  };

  useEffect(() => setAttPage(1), [attSummary]);
  useEffect(() => setLeavePage(1), [leaveRequests]);

  const attRecords = attSummary?.records ?? [];
  const attTotalPages = Math.ceil(attRecords.length / PAGE_SIZE);
  const attPaged = attRecords.slice((attPage - 1) * PAGE_SIZE, attPage * PAGE_SIZE);

  const leaveTotalPages = Math.ceil(leaveRequests.length / PAGE_SIZE);
  const leavePaged = leaveRequests.slice((leavePage - 1) * PAGE_SIZE, leavePage * PAGE_SIZE);

  const salaryHistory = employee?.salaryHistory ?? [];
  const salaryTotalPages = Math.ceil(salaryHistory.length / PAGE_SIZE);
  const salaryPaged = salaryHistory.slice((salaryPage - 1) * PAGE_SIZE, salaryPage * PAGE_SIZE);

  const TABS = [
    { id: "profile", label: "Profile" },
    { id: "attendance", label: "Attendance" },
    { id: "leave", label: "Leave" },
    ...(canViewSalary ? [{ id: "salary", label: "Salary History" }] : []),
  ];

  if (loading) {
    return <div className="flex flex-col gap-4"><Skeleton className="h-32 rounded-[var(--radius-lg)]" /><Skeleton className="h-64 rounded-[var(--radius-lg)]" /></div>;
  }
  if (!employee) return <div className="p-8 text-center text-[var(--text-secondary)]">Employee not found.</div>;

  const ec = employee.emergencyContact as { name: string; phone: string; relation: string } | null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--interactive-primary-bg)] text-xl font-bold text-[var(--text-primary)]">
          {employee.profileImage
            ? <img src={employee.profileImage} alt="" className="h-16 w-16 rounded-full object-cover" />
            : getInitials(employee.firstName, employee.lastName)
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{employee.firstName} {employee.lastName}</h1>
            <span className="text-sm text-[var(--text-tertiary)]">{employee.employeeId}</span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[employee.status] ?? ""}`}>
              {employee.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{employee.position ?? "No position"} {employee.department ? `· ${employee.department.name}` : ""}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><User size={11} />{employee.user.email}</span>
            {employee.phone && <span>{employee.phone}</span>}
            {employee.joiningDate && <span className="flex items-center gap-1"><Calendar size={11} />Joined {format(new Date(employee.joiningDate), "MMM d, yyyy")}</span>}
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
            <Edit2 size={13} /> Edit
          </Button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Briefcase, label: "Projects", value: employee._count?.projectMembers ?? 0 },
          { icon: Clock, label: "Tasks", value: employee._count?.tasks ?? 0 },
          { icon: Calendar, label: "Leave Requests", value: employee._count?.leaveRequests ?? 0 },
          { icon: DollarSign, label: "Base Salary", value: canViewSalary ? `${employee.currency} ${Number(employee.baseSalary).toLocaleString()}` : "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={13} className="text-[var(--text-secondary)]" />
              <p className="text-xs text-[var(--text-secondary)]">{label}</p>
            </div>
            <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} className="mb-4" />

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Personal Info */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Personal Information</h3>
              <dl className="flex flex-col gap-2">
                {[
                  ["Email", employee.user.email],
                  ["Phone", employee.phone ?? "—"],
                  ["Address", employee.address ?? "—"],
                  ["Department", employee.department?.name ?? "—"],
                  ["Employment Type", employee.employmentType.replace("_", " ")],
                  ["Working Hours", `${employee.workingHours}h/day`],
                  ["Joining Date", employee.joiningDate ? format(new Date(employee.joiningDate), "MMM d, yyyy") : "—"],
                  ["Role", employee.user.role],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-sm">
                    <dt className="text-[var(--text-secondary)] shrink-0">{label}</dt>
                    <dd className="text-[var(--text-primary)] text-right">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Emergency Contact */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Emergency Contact</h3>
              {ec ? (
                <dl className="flex flex-col gap-2">
                  {[["Name", ec.name], ["Phone", ec.phone], ["Relation", ec.relation]].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between text-sm">
                      <dt className="text-[var(--text-secondary)]">{l}</dt>
                      <dd className="text-[var(--text-primary)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No emergency contact on file.</p>
              )}

              {employee.notes && (
                <>
                  <h3 className="mt-4 mb-2 text-sm font-semibold text-[var(--text-primary)]">Notes</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{employee.notes}</p>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="flex flex-col gap-4">
            {/* Month/Year picker */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[140px]">
                <Select
                  value={String(attMonth)}
                  onValueChange={(v) => setAttMonth(Number(v))}
                  options={["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => ({ value: String(i + 1), label: m }))}
                />
              </div>
              <div className="w-[110px]">
                <Select
                  value={String(attYear)}
                  onValueChange={(v) => setAttYear(Number(v))}
                  options={[2023, 2024, 2025, 2026].map((y) => ({ value: String(y), label: String(y) }))}
                />
              </div>
            </div>

            {attLoading ? (
              <Skeleton className="h-40 rounded-[var(--radius-lg)]" />
            ) : attSummary ? (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Present", attSummary.present, "var(--status-active-text)"],
                    ["Late", attSummary.late, "var(--status-pending-text)"],
                    ["Absent", attSummary.absent, "var(--status-cancelled-text)"],
                    ["WFH", attSummary.wfh, "var(--text-secondary)"],
                  ].map(([label, val, color]) => (
                    <div key={String(label)} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-3 text-center">
                      <p className="text-2xl font-bold" style={{ color: `${color}` }}>{val}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Attendance records */}
                {attRecords.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)] text-center py-8">No attendance records for this period.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                  <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                          {["Date","Check In","Check Out","Hours","Status"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {attPaged.map((r) => (
                          <tr key={r.id} className="border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0">
                            <td className="px-4 py-2.5 text-[var(--text-primary)]">{format(new Date(r.date), "EEE, MMM d")}</td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.checkIn ? format(new Date(r.checkIn), "HH:mm") : "—"}</td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.checkOut ? format(new Date(r.checkOut), "HH:mm") : "—"}</td>
                            <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.totalMinutes ? `${Math.floor(r.totalMinutes / 60)}h ${r.totalMinutes % 60}m` : "—"}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${ATT_STATUS_STYLES[r.status] ?? ""}`}>
                                {r.status.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={attPage} totalPages={attTotalPages} total={attRecords.length} pageSize={PAGE_SIZE} onPageChange={setAttPage} />
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {activeTab === "leave" && (
          <div className="flex flex-col gap-4">
            {/* Leave balance cards */}
            {leaveBalances.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {leaveBalances.map((b) => (
                  <div key={b.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-3">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">{b.leaveType.name}</p>
                    <p className="text-xl font-bold text-[var(--text-primary)]">{b.remaining}<span className="text-sm font-normal text-[var(--text-secondary)]">/{b.allocated}</span></p>
                    <div className="mt-1.5 h-1 rounded-full bg-[var(--interactive-primary-bg)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--interactive-primary)]"
                        style={{ width: `${b.allocated > 0 ? Math.round((b.remaining / b.allocated) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leave request history */}
            {leaveRequests.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">No leave requests found.</p>
            ) : (
              <div className="flex flex-col gap-3">
              <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                      {["Type","Dates","Days","Reason","Status"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leavePaged.map((r) => (
                      <tr key={r.id} className="border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0">
                        <td className="px-4 py-2.5 text-[var(--text-primary)]">{r.leaveType.name}</td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                          {format(new Date(r.startDate), "MMM d")} – {format(new Date(r.endDate), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.days}</td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)] max-w-[200px] truncate">{r.reason ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${LEAVE_STATUS_STYLES[r.status] ?? ""}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={leavePage} totalPages={leaveTotalPages} total={leaveRequests.length} pageSize={PAGE_SIZE} onPageChange={setLeavePage} />
              </div>
            )}
          </div>
        )}

        {activeTab === "salary" && canViewSalary && (
          <div className="flex flex-col gap-3">
            {salaryHistory.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">No salary history found.</p>
            ) : (
              <>
              <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                      {["Effective Date","Base Salary","Notes"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salaryPaged.map((s) => (
                      <tr key={s.id} className="border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0">
                        <td className="px-4 py-2.5 text-[var(--text-primary)]">{format(new Date(s.effectiveDate), "MMM d, yyyy")}</td>
                        <td className="px-4 py-2.5 font-mono text-[var(--text-primary)]">{s.currency} {Number(s.baseSalary).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={salaryPage} totalPages={salaryTotalPages} total={salaryHistory.length} pageSize={PAGE_SIZE} onPageChange={setSalaryPage} />
              </>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <EmployeeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            window.fetch(`/api/employees/${employeeId}`).then(r => r.json()).then(d => setEmployee(d.data));
          }}
          employee={employee as Parameters<typeof EmployeeModal>[0]["employee"]}
        />
      )}
    </div>
  );
}
