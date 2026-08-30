"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeCard } from "./EmployeeCard";
import { EmployeesTable } from "./EmployeesTable";
import { EmployeeModal } from "./EmployeeModal";
import { useTeamStore } from "@/lib/store/team.store";
import type { Employee } from "@/lib/store/team.store";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TERMINATED", label: "Terminated" },
];

interface Props {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewSalary: boolean;
}

export function TeamContent({ canCreate, canEdit, canDelete, canViewSalary }: Props) {
  const router = useRouter();
  const { data, status, fetch, invalidate } = useTeamStore();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const loading = status === "idle" || status === "loading";

  const employees = useMemo(() => {
    const all = data ?? [];
    return all.filter((emp) => {
      if (statusFilter && emp.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return emp.firstName.toLowerCase().includes(q) || emp.lastName.toLowerCase().includes(q) || emp.user.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, search, statusFilter]);

  const refresh = () => { invalidate(); fetch(); };

  const handleDelete = async (id: string) => {
    if (!confirm("Terminate this employee? This cannot be undone.")) return;
    const res = await window.fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Employee terminated"); refresh(); }
    else toast.error("Failed to terminate");
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
          <Input
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter} options={STATUS_OPTIONS} />
        </div>
        <div className="flex rounded-[var(--radius-md)] border border-[var(--border-default)] overflow-hidden">
          {(["grid", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`flex h-9 w-9 items-center justify-center cursor-pointer transition-colors ${
                view === v
                  ? "bg-[var(--interactive-primary)] text-[var(--text-on-primary)]"
                  : "bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)]"
              }`}
            >
              {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>
        {canCreate && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }} size="sm">
            <Plus size={14} /> Add Employee
          </Button>
        )}
      </div>

      {loading ? (
        <div className={view === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-2"}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] py-16">
          <p className="text-sm font-medium text-[var(--text-primary)]">No employees found</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {search || statusFilter ? "Try adjusting your filters" : "Add your first employee to get started"}
          </p>
          {canCreate && !search && !statusFilter && (
            <Button onClick={() => { setEditing(null); setModalOpen(true); }} size="sm">
              <Plus size={14} /> Add Employee
            </Button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={(e) => handleEdit(e as Employee)}
              onDelete={handleDelete}
              onClick={(id) => router.push(`/team/${id}`)}
            />
          ))}
        </div>
      ) : (
        <EmployeesTable
          employees={employees}
          canEdit={canEdit}
          canDelete={canDelete}
          canViewSalary={canViewSalary}
          onEdit={(e) => handleEdit(e as Employee)}
          onDelete={handleDelete}
        />
      )}

      <EmployeeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={refresh}
        employee={editing}
      />
    </div>
  );
}
