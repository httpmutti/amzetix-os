"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Briefcase, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { usePayrollStore } from "@/lib/store/payroll.store";
import type { PayrollRun } from "@/lib/store/payroll.store";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "draft", CALCULATED: "in-progress", APPROVED: "active", PAID: "completed", CANCELLED: "lost",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const currentYear = new Date().getFullYear();
const MONTH_OPTIONS = MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m }));
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2].map((y) => ({ value: String(y), label: String(y) }));

interface Props { canCreate: boolean }

export function PayrollContent({ canCreate }: Props) {
  const { data, status, fetch, mutate } = usePayrollStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);

  const loading = status === "idle" || status === "loading";
  const runs: PayrollRun[] = data ?? [];

  const handleCreate = async () => {
    setSubmitting(true);
    const res = await window.fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: Number(month), year: Number(year) }),
    });
    const json = await res.json();
    if (res.ok) {
      toast.success("Payroll run created");
      setModalOpen(false);
      const created: PayrollRun = json.data ?? json;
      mutate((list) => [created, ...list]);
    } else {
      toast.error(json.error ?? "Failed to create payroll run");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{runs.length} payroll run{runs.length !== 1 ? "s" : ""}</p>
        {canCreate && <Button size="sm" onClick={() => setModalOpen(true)}><Plus size={14} /> New Payroll Run</Button>}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] py-16">
          <Briefcase size={28} className="text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">No payroll runs yet</p>
          {canCreate && <Button size="sm" onClick={() => setModalOpen(true)}><Plus size={14} /> Create First Run</Button>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                {["Period", "Employees", "Gross Total", "Net Total", "Status", "Paid At", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} className="group border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0 hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[var(--text-primary)]">{MONTH_NAMES[run.month - 1]} {run.year}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">{run._count.items}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] tabular-nums">{formatCurrency(run.totalGross, "USD")}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)] tabular-nums">{formatCurrency(run.totalNet, "USD")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={(STATUS_BADGE[run.status] ?? "default") as never}>{run.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                    {run.paidAt ? format(new Date(run.paidAt), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/payroll/${run.id}`} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                      View <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Payroll Run">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            This will auto-populate salaries for all active employees based on their base salary and attendance for the selected period.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Month</p>
              <Select value={month} onValueChange={setMonth} options={MONTH_OPTIONS} />
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Year</p>
              <Select value={year} onValueChange={setYear} options={YEAR_OPTIONS} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={submitting}>Generate Payroll</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
