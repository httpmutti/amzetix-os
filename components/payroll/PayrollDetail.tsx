"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, DollarSign, Edit2, Printer, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "draft", CALCULATED: "in-progress", APPROVED: "active", PAID: "completed", CANCELLED: "lost",
};

interface EmployeeItem {
  id: string;
  employeeId: string;
  baseSalary: number | string;
  allowances: number | string;
  bonuses: number | string;
  overtime: number | string;
  grossSalary: number | string;
  deductions: number | string;
  unpaidLeave: number | string;
  absentDeduction?: number | string | null;
  hoursDeduction?: number | string | null;
  weeklyShortfalls?: number | null;
  advances: number | string;
  taxDeductions: number | string;
  otherDeductions: number | string;
  netSalary: number | string;
  currency: string;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  overtimeHours: number | string;
  notes?: string | null;
  employee: {
    firstName: string;
    lastName: string;
    position?: string | null;
    department?: { name: string } | null;
    user: { name?: string | null; email?: string | null };
  };
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  paidAt?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
  items: EmployeeItem[];
}

interface Props {
  payrollId: string;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
}

export function PayrollDetail({ payrollId, canEdit, canApprove, canDelete }: Props) {
  const router = useRouter();
  const [payroll, setPayroll] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeItem | null>(null);
  const [allowances, setAllowances] = useState(0);
  const [bonuses, setBonuses] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [advances, setAdvances] = useState(0);
  const [taxDeductions, setTaxDeductions] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Slip print
  const [slipItem, setSlipItem] = useState<EmployeeItem | null>(null);
  const [slipOpen, setSlipOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await window.fetch(`/api/payroll/${payrollId}`);
    const json = await res.json();
    setPayroll(json.data ?? null);
    setLoading(false);
  }, [payrollId]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (item: EmployeeItem) => {
    setEditItem(item);
    setAllowances(Number(item.allowances));
    setBonuses(Number(item.bonuses));
    setOvertimeHours(Number(item.overtimeHours));
    setAdvances(Number(item.advances));
    setTaxDeductions(Number(item.taxDeductions));
    setOtherDeductions(Number(item.otherDeductions));
    setEditNotes(item.notes ?? "");
    setEditOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!editItem) return;
    setSaving(true);
    const res = await window.fetch(`/api/payroll/${payrollId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: editItem.employeeId,
        allowances, bonuses, overtimeHours, advances, taxDeductions, otherDeductions, notes: editNotes,
      }),
    });
    const json = await res.json();
    if (res.ok) { toast.success("Adjustments saved"); setEditOpen(false); load(); }
    else toast.error(json.error ?? "Failed");
    setSaving(false);
  };

  const handleApprove = async () => {
    if (!confirm("Approve this payroll run?")) return;
    const res = await window.fetch(`/api/payroll/${payrollId}/approve`, { method: "POST" });
    const json = await res.json();
    if (res.ok) { toast.success("Payroll approved"); load(); }
    else toast.error(json.error ?? "Failed");
  };

  const handlePay = async () => {
    if (!confirm("Mark this payroll as paid? This action cannot be undone.")) return;
    const res = await window.fetch(`/api/payroll/${payrollId}/pay`, { method: "POST" });
    const json = await res.json();
    if (res.ok) { toast.success("Payroll marked as paid"); load(); }
    else toast.error(json.error ?? "Failed");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this payroll run?")) return;
    const res = await window.fetch(`/api/payroll/${payrollId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Payroll deleted"); router.push("/payroll"); }
    else toast.error("Failed to delete");
  };

  const openSlip = (item: EmployeeItem) => { setSlipItem(item); setSlipOpen(true); };

  const handlePrintSlip = () => {
    const content = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Payslip</title><style>
      body{font-family:sans-serif;padding:32px;color:#111}
      h1{font-size:20px;margin:0 0 4px}
      .sub{color:#666;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      td,th{padding:6px 12px;border:1px solid #e5e7eb}
      th{background:#f9fafb;font-weight:600;text-align:left}
      .total td{font-weight:700;border-top:2px solid #111}
      .net{font-size:18px;font-weight:700;margin-top:20px}
      @media print{body{padding:0}}
    </style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  if (loading) return <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;
  if (!payroll) return <p className="text-sm text-[var(--text-secondary)]">Payroll not found.</p>;

  const totalNet = payroll.items.reduce((s, i) => s + Number(i.netSalary), 0);
  const totalGross = payroll.items.reduce((s, i) => s + Number(i.grossSalary), 0);
  const totalDeductions = payroll.items.reduce((s, i) => s + Number(i.deductions), 0);
  const editable = payroll.status === "DRAFT" || payroll.status === "CALCULATED";

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{MONTH_NAMES[payroll.month - 1]} {payroll.year} Payroll</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{payroll.items.length} employees</p>
          </div>
          <Badge variant={(STATUS_BADGE[payroll.status] ?? "default") as never}>{payroll.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && payroll.status !== "APPROVED" && payroll.status !== "PAID" && (
            <Button size="sm" variant="outline" onClick={handleApprove}><CheckCircle size={14} /> Approve</Button>
          )}
          {canApprove && payroll.status === "APPROVED" && (
            <Button size="sm" onClick={handlePay}><DollarSign size={14} /> Mark as Paid</Button>
          )}
          {canDelete && payroll.status !== "PAID" && (
            <button type="button" onClick={handleDelete} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--color-danger-500)] hover:bg-[var(--interactive-secondary-hover)] transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Gross Total", value: formatCurrency(totalGross, "PKR") },
          { label: "Total Deductions", value: formatCurrency(totalDeductions, "PKR") },
          { label: "Net Payable", value: formatCurrency(totalNet, "PKR"), highlight: true },
        ].map(k => (
          <div key={k.label} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3">
            <p className="text-xs text-[var(--text-secondary)] mb-1">{k.label}</p>
            <p className={`text-xl font-bold tabular-nums ${k.highlight ? "text-[var(--status-active-text)]" : "text-[var(--text-primary)]"}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Employee table */}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
              {["Employee", "Position", "Days", "Base Salary", "Allowances", "Bonuses", "Overtime", "Deductions", "Net Salary", ""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payroll.items.map(item => (
              <tr key={item.id} className="group border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0 hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text-primary)]">{item.employee.firstName} {item.employee.lastName}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{item.employee.user.email}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{item.employee.position ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                  <span className="text-[var(--color-success-600)]">{item.presentDays}P</span>
                  {item.leaveDays > 0 && <span className="text-[var(--color-info-600)] ml-1">{item.leaveDays}L</span>}
                  {item.absentDays > 0 && <span className="text-[var(--color-danger-500)] ml-1">{item.absentDays}A</span>}
                  <span className="text-[var(--text-tertiary)] ml-1">/{item.workingDays}</span>
                </td>
                <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">{formatCurrency(Number(item.baseSalary), item.currency)}</td>
                <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">{formatCurrency(Number(item.allowances) + Number(item.bonuses), item.currency)}</td>
                <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">{formatCurrency(Number(item.bonuses), item.currency)}</td>
                <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">{formatCurrency(Number(item.overtime), item.currency)}</td>
                <td className="px-4 py-3 tabular-nums text-[var(--color-danger-500)]">−{formatCurrency(Number(item.deductions), item.currency)}</td>
                <td className="px-4 py-3 tabular-nums font-semibold text-[var(--status-active-text)]">{formatCurrency(Number(item.netSalary), item.currency)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => openSlip(item)} title="View slip" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors">
                      <Printer size={13} />
                    </button>
                    {canEdit && editable && (
                      <button type="button" onClick={() => openEdit(item)} title="Edit adjustments" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors">
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Adjustments Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Adjust — ${editItem?.employee.firstName} ${editItem?.employee.lastName}`}>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Base: {editItem ? formatCurrency(Number(editItem.baseSalary), editItem.currency) : ""} ·
            Present: {editItem?.presentDays}/{editItem?.workingDays} days
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Allowances", value: allowances, set: setAllowances },
              { label: "Bonuses", value: bonuses, set: setBonuses },
              { label: "Overtime Hours", value: overtimeHours, set: setOvertimeHours },
              { label: "Advances", value: advances, set: setAdvances },
              { label: "Tax Deductions", value: taxDeductions, set: setTaxDeductions },
              { label: "Other Deductions", value: otherDeductions, set: setOtherDeductions },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">{f.label}</p>
                <NumberInput value={f.value} onChange={e => f.set(+e.target.value || 0)} min={0} step={0.01} />
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Notes</p>
            <input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Optional note…" className="w-full rounded-[var(--radius-md)] border border-[var(--border-input)] bg-[var(--surface-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAdjustment} loading={saving}>Save & Recalculate</Button>
          </div>
        </div>
      </Modal>

      {/* Payslip Modal */}
      <Modal open={slipOpen} onClose={() => setSlipOpen(false)} title="Payslip">
        <div className="flex flex-col gap-4">
          <div ref={printRef}>
            {slipItem && (
              <div className="text-sm">
                <h1 className="text-lg font-bold text-[var(--text-primary)]">PAYSLIP</h1>
                <p className="text-xs text-[var(--text-secondary)] mb-4">{MONTH_NAMES[payroll.month - 1]} {payroll.year}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-[var(--text-secondary)] mb-4">
                  <span className="font-medium text-[var(--text-primary)]">{slipItem.employee.firstName} {slipItem.employee.lastName}</span>
                  <span>{slipItem.employee.position ?? ""}</span>
                  <span>{slipItem.employee.user.email}</span>
                  <span>{slipItem.employee.department?.name ?? ""}</span>
                </div>
                <table className="w-full border-collapse text-xs mb-2">
                  <tbody>
                    {[
                      ["Base Salary", formatCurrency(Number(slipItem.baseSalary), slipItem.currency)],
                      ["Allowances", formatCurrency(Number(slipItem.allowances), slipItem.currency)],
                      ["Bonuses", formatCurrency(Number(slipItem.bonuses), slipItem.currency)],
                      ["Overtime", formatCurrency(Number(slipItem.overtime), slipItem.currency)],
                    ].map(([label, val]) => (
                      <tr key={label} className="border-b border-[var(--border-subtle)]">
                        <td className="py-1 text-[var(--text-secondary)]">{label}</td>
                        <td className="py-1 text-right tabular-nums text-[var(--text-primary)]">{val}</td>
                      </tr>
                    ))}
                    <tr className="border-b border-[var(--border-default)] font-semibold">
                      <td className="py-1.5 text-[var(--text-primary)]">Gross Salary</td>
                      <td className="py-1.5 text-right tabular-nums text-[var(--text-primary)]">{formatCurrency(Number(slipItem.grossSalary), slipItem.currency)}</td>
                    </tr>
                    {[
                      ["Unpaid Leave", Number(slipItem.unpaidLeave)],
                      ["Absent Penalty (Rs. 500/day)", Number(slipItem.absentDeduction ?? 0)],
                      ...(Number(slipItem.hoursDeduction ?? 0) > 0
                        ? [[`Hours Shortfall ×${slipItem.weeklyShortfalls ?? 0} wk (Rs. 500/wk)`, Number(slipItem.hoursDeduction ?? 0)] as [string, number]]
                        : []),
                      ["Advances", Number(slipItem.advances)],
                      ["Tax", Number(slipItem.taxDeductions)],
                      ["Other Deductions", Number(slipItem.otherDeductions)],
                    ].filter(([, v]) => (v as number) > 0).map(([label, val]) => (
                      <tr key={label as string} className="border-b border-[var(--border-subtle)]">
                        <td className="py-1 text-[var(--color-danger-500)]">{label}</td>
                        <td className="py-1 text-right tabular-nums text-[var(--color-danger-500)]">−{formatCurrency(val as number, slipItem.currency)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-base">
                      <td className="pt-2 text-[var(--text-primary)]">Net Salary</td>
                      <td className="pt-2 text-right tabular-nums text-[var(--status-active-text)]">{formatCurrency(Number(slipItem.netSalary), slipItem.currency)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] text-[var(--text-tertiary)]">
                  <span>Working days: {slipItem.workingDays}</span>
                  <span>Present: {slipItem.presentDays}</span>
                  <span>Absent: {slipItem.absentDays}</span>
                  {(slipItem.weeklyShortfalls ?? 0) > 0 && (
                    <span className="text-[var(--color-warning-500)]">Weeks &lt;45hr: {slipItem.weeklyShortfalls}</span>
                  )}
                </div>
                {payroll.status === "PAID" && payroll.paidAt && (
                  <p className="mt-3 text-xs text-[var(--color-success-600)] font-medium">
                    Paid on {format(new Date(payroll.paidAt), "MMMM d, yyyy")}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setSlipOpen(false)}><X size={14} /> Close</Button>
            <Button variant="outline" onClick={handlePrintSlip}><Printer size={14} /> Print Slip</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
