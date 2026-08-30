"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 10;

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  status: string;
  employmentType: string;
  baseSalary: number | string;
  currency: string;
  department?: { name: string } | null;
  user: { email: string };
  profileImage?: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-[var(--status-active-bg)] text-[var(--status-active-text)]",
  ON_LEAVE: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  SUSPENDED: "bg-[var(--status-paused-bg)] text-[var(--status-paused-text)]",
  TERMINATED: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)]",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

const EMP_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
  INTERN: "Intern",
};

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

interface Props {
  employees: Employee[];
  canEdit: boolean;
  canDelete: boolean;
  canViewSalary: boolean;
  onEdit: (e: Employee) => void;
  onDelete: (id: string) => void;
}

export function EmployeesTable({ employees, canEdit, canDelete, canViewSalary, onEdit, onDelete }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [employees]);

  const totalPages = Math.ceil(employees.length / PAGE_SIZE);
  const paged = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">Employee</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">Position</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">Department</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">Type</th>
            {canViewSalary && <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">Salary</th>}
            <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">Status</th>
            {(canEdit || canDelete) && <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--text-secondary)]">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {paged.map((emp) => (
            <tr
              key={emp.id}
              onClick={() => router.push(`/team/${emp.id}`)}
              className="group border-b border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--interactive-secondary-hover)] cursor-pointer transition-colors last:border-0"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--interactive-primary-bg)] text-xs font-semibold text-[var(--text-primary)]">
                    {emp.profileImage
                      ? <img src={emp.profileImage} alt="" className="h-8 w-8 rounded-full object-cover" />
                      : getInitials(emp.firstName, emp.lastName)
                    }
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{emp.user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{emp.position ?? "—"}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{emp.department?.name ?? "—"}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{EMP_LABELS[emp.employmentType] ?? emp.employmentType}</td>
              {canViewSalary && (
                <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                  {emp.currency} {Number(emp.baseSalary).toLocaleString()}
                </td>
              )}
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[emp.status] ?? STATUS_STYLES.ACTIVE}`}>
                  {STATUS_LABELS[emp.status] ?? emp.status}
                </span>
              </td>
              {(canEdit || canDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="hidden group-hover:flex items-center justify-end gap-1">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(emp); }}
                        className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-primary-bg)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(emp.id); }}
                        className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger-text)] transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Pagination page={page} totalPages={totalPages} total={employees.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
