"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, ClipboardList, Search, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  createdAt: string;
  performedBy: { name: string | null; email: string; image: string | null };
}

interface Meta {
  total: number;
  page: number;
  pageCount: number;
}

interface FilterUser {
  id: string;
  name: string | null;
  email: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "var(--color-success-700)",
  UPDATE: "var(--interactive-primary)",
  DELETE: "var(--color-danger-500)",
  SOFT_DELETE: "var(--color-danger-500)",
  LOGIN: "var(--text-secondary)",
  APPROVE: "var(--color-success-700)",
  REJECT: "var(--color-danger-500)",
  SEND: "var(--interactive-primary)",
  PAYMENT_RECORDED: "var(--color-success-700)",
};

function ActionChip({ action }: { action: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide"
      style={{
        color: ACTION_COLORS[action] ?? "var(--text-secondary)",
        background: "var(--surface-page)",
        border: "1px solid var(--border-default)",
      }}
    >
      {action.replace(/_/g, " ")}
    </span>
  );
}

export function AuditLogsContent({ users }: { users: FilterUser[] }) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageCount: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const buildQuery = useCallback((p: number) => {
    const params = new URLSearchParams({ page: String(p) });
    if (search) params.set("search", search);
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    if (userId) params.set("userId", userId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [search, action, entity, userId, dateFrom, dateTo]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?${buildQuery(p)}`);
      const json = await res.json();
      setEntries(json.data ?? []);
      setMeta(json.meta ?? { total: 0, page: 1, pageCount: 1 });
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1); }, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, action, entity, userId, dateFrom, dateTo]); // eslint-disable-line

  useEffect(() => { load(page); }, [load, page]);

  async function exportCsv() {
    const params = new URLSearchParams(buildQuery(1));
    params.set("export", "csv");
    const res = await fetch(`/api/audit-logs?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const ACTION_OPTIONS = [
    { value: "", label: "All actions" },
    { value: "CREATE", label: "Create" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" },
    { value: "SOFT_DELETE", label: "Soft Delete" },
    { value: "APPROVE", label: "Approve" },
    { value: "REJECT", label: "Reject" },
    { value: "SEND", label: "Send" },
    { value: "LOGIN", label: "Login" },
    { value: "PAYMENT_RECORDED", label: "Payment Recorded" },
  ];

  const ENTITY_OPTIONS = [
    { value: "", label: "All entities" },
    { value: "Invoice", label: "Invoice" },
    { value: "Payment", label: "Payment" },
    { value: "Expense", label: "Expense" },
    { value: "Project", label: "Project" },
    { value: "Task", label: "Task" },
    { value: "Employee", label: "Employee" },
    { value: "Client", label: "Client" },
    { value: "LeaveRequest", label: "Leave Request" },
    { value: "PayrollRun", label: "Payroll" },
    { value: "Document", label: "Document" },
    { value: "User", label: "User" },
  ];

  const USER_OPTIONS = [
    { value: "", label: "All users" },
    ...users.map(u => ({ value: u.id, label: u.name ?? u.email })),
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search description…"
                className="w-full h-9 pl-9 pr-3 text-sm rounded-[var(--radius-md)] bg-[var(--surface-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] outline-none transition-colors"
              />
            </div>
          </div>
          <Select
            value={action}
            onValueChange={setAction}
            options={ACTION_OPTIONS}
            className="w-40"
          />
          <Select
            value={entity}
            onValueChange={setEntity}
            options={ENTITY_OPTIONS}
            className="w-40"
          />
          <Select
            value={userId}
            onValueChange={setUserId}
            options={USER_OPTIONS}
            className="w-44"
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-36 text-xs"
              placeholder="From"
            />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-36 text-xs"
              placeholder="To"
            />
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4 animate-pulse">
                <div className="flex-1 h-3 rounded" style={{ background: "var(--surface-page)" }} />
                <div className="w-24 h-3 rounded" style={{ background: "var(--surface-page)" }} />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={ClipboardList as LucideIcon} title="No audit logs" description="No activity matches your filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "var(--surface-page)" }}>
                <tr>
                  {["When", "By", "Action", "Entity", "Description"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{ color: "var(--text-secondary)", borderColor: "var(--border-default)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={i < entries.length - 1 ? "border-b" : ""}
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={entry.performedBy.image ?? undefined}
                          name={entry.performedBy.name ?? entry.performedBy.email}
                          size="xs"
                        />
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                          {entry.performedBy.name ?? entry.performedBy.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <ActionChip action={entry.action} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {entry.entity}
                        {entry.entityId && (
                          <span className="ml-1 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                            #{entry.entityId.slice(-6)}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-sm">
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{entry.description}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {meta.pageCount > 1 && (
        <Pagination
          page={page}
          totalPages={meta.pageCount}
          total={meta.total}
          pageSize={20}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
