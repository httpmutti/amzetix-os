"use client";

import { Edit2, Trash2 } from "lucide-react";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  status: string;
  profileImage?: string | null;
  department?: { name: string } | null;
  user: { email: string };
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

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

interface Props {
  employee: Employee;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (e: Employee) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}

export function EmployeeCard({ employee, canEdit, canDelete, onEdit, onDelete, onClick }: Props) {
  return (
    <div
      onClick={() => onClick(employee.id)}
      className="group relative flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 cursor-pointer hover:border-[var(--border-strong)] transition-colors"
    >
      {/* Action buttons */}
      <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1">
        {canEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Edit2 size={13} />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(employee.id); }}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--status-danger-bg)] hover:text-[var(--status-danger-text)] transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--interactive-primary-bg)] text-sm font-semibold text-[var(--text-primary)]">
          {employee.profileImage
            ? <img src={employee.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
            : getInitials(employee.firstName, employee.lastName)
          }
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-xs text-[var(--text-secondary)] truncate">{employee.employeeId}</p>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1">
        {employee.position && (
          <p className="text-xs text-[var(--text-secondary)] truncate">{employee.position}</p>
        )}
        {employee.department && (
          <p className="text-xs text-[var(--text-tertiary)] truncate">{employee.department.name}</p>
        )}
        <p className="text-xs text-[var(--text-tertiary)] truncate">{employee.user.email}</p>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[employee.status] ?? STATUS_STYLES.ACTIVE}`}>
          {STATUS_LABELS[employee.status] ?? employee.status}
        </span>
      </div>
    </div>
  );
}
