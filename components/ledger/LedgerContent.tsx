"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, ChevronDown, ChevronRight, BookOpen, CheckCircle2, AlertCircle, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { InputLabel } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { NumberInput } from "@/components/ui/number-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLedgerStore, type LoanAccount, type LoanRepayment } from "@/lib/store/ledger.store";

const PKR = (n: number | string) =>
  `Rs. ${Number(n).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const STATUS_CONFIG: Record<string, { label: string; badge: BadgeVariant; icon: React.ElementType }> = {
  ACTIVE:       { label: "Active",        badge: "warning",  icon: AlertCircle  },
  FULLY_REPAID: { label: "Fully Repaid",  badge: "paid",     icon: CheckCircle2 },
  ON_HOLD:      { label: "On Hold",       badge: "on-hold",  icon: PauseCircle  },
  DEFAULTED:    { label: "Defaulted",     badge: "danger",   icon: AlertCircle  },
};

const STATUS_OPTIONS = [
  { value: "ACTIVE",       label: "Active"       },
  { value: "FULLY_REPAID", label: "Fully Repaid" },
  { value: "ON_HOLD",      label: "On Hold"      },
  { value: "DEFAULTED",    label: "Defaulted"    },
];

const METHOD_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH",          label: "Cash"          },
  { value: "CREDIT_CARD",   label: "Credit Card"   },
  { value: "PAYPAL",        label: "PayPal"        },
  { value: "OTHER",         label: "Other"         },
];

interface Props {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface LoanForm {
  source: string;
  principal: string;
  interestRate: string;
  startDate: string;
  dueDate: string;
  purpose: string;
  editStatus: string;
  notes: string;
}

interface RepayForm {
  amount: string;
  paidAt: string;
  method: string;
  referenceId: string;
  note: string;
}

const emptyLoan: LoanForm = {
  source: "", principal: "", interestRate: "",
  startDate: "", dueDate: "", purpose: "", editStatus: "ACTIVE", notes: "",
};
const emptyRepay: RepayForm = {
  amount: "", paidAt: new Date().toISOString().split("T")[0],
  method: "BANK_TRANSFER", referenceId: "", note: "",
};

export function LedgerContent({ canCreate, canEdit, canDelete }: Props) {
  const { data, status, fetch: fetchLoans, invalidate } = useLedgerStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editLoan, setEditLoan] = useState<LoanAccount | null>(null);
  const [loanForm, setLoanForm] = useState<LoanForm>(emptyLoan);
  const [loanSaving, setLoanSaving] = useState(false);

  const [showRepayModal, setShowRepayModal] = useState<string | null>(null);
  const [repayForm, setRepayForm] = useState<RepayForm>(emptyRepay);
  const [repaySaving, setRepaySaving] = useState(false);

  const [deletingLoan, setDeletingLoan] = useState<string | null>(null);
  const [deletingRepay, setDeletingRepay] = useState<string | null>(null);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const loans = data?.loans ?? [];
  const totalDebt = data?.totalDebt ?? 0;
  const totalRepaidAll = data?.totalRepaidAll ?? 0;

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openAddLoan() {
    setEditLoan(null);
    setLoanForm(emptyLoan);
    setShowLoanModal(true);
  }

  function openEditLoan(loan: LoanAccount) {
    setEditLoan(loan);
    setLoanForm({
      source: loan.source,
      principal: String(loan.principal),
      interestRate: loan.interestRate ? String(loan.interestRate) : "",
      startDate: loan.startDate.slice(0, 10),
      dueDate: loan.dueDate ? loan.dueDate.slice(0, 10) : "",
      purpose: loan.purpose ?? "",
      editStatus: loan.status,
      notes: loan.notes ?? "",
    });
    setShowLoanModal(true);
  }

  async function saveLoan() {
    if (!loanForm.source || !loanForm.principal || !loanForm.startDate) {
      toast.error("Source, amount and start date are required");
      return;
    }
    setLoanSaving(true);
    try {
      const payload: Record<string, unknown> = {
        source: loanForm.source,
        principal: Number(loanForm.principal),
        startDate: loanForm.startDate,
        ...(loanForm.interestRate && { interestRate: Number(loanForm.interestRate) }),
        ...(loanForm.dueDate && { dueDate: loanForm.dueDate }),
        ...(loanForm.purpose && { purpose: loanForm.purpose }),
        ...(loanForm.notes && { notes: loanForm.notes }),
        ...(editLoan && { status: loanForm.editStatus }),
      };

      const url = editLoan ? `/api/ledger/${editLoan.id}` : "/api/ledger";
      const method = editLoan ? "PATCH" : "POST";
      const res = await window.fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      toast.success(editLoan ? "Loan updated" : "Loan created");
      invalidate();
      fetchLoans();
      setShowLoanModal(false);
    } catch {
      toast.error("Failed to save loan");
    } finally {
      setLoanSaving(false);
    }
  }

  async function deleteLoanConfirm(id: string) {
    setDeletingLoan(id);
    try {
      const res = await window.fetch(`/api/ledger/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Loan deleted");
      invalidate();
      fetchLoans();
    } catch {
      toast.error("Failed to delete loan");
    } finally {
      setDeletingLoan(null);
    }
  }

  function openRepay(loanId: string) {
    setRepayForm(emptyRepay);
    setShowRepayModal(loanId);
  }

  async function saveRepayment() {
    if (!repayForm.amount || !repayForm.paidAt) {
      toast.error("Amount and date are required");
      return;
    }
    setRepaySaving(true);
    try {
      const res = await window.fetch(`/api/ledger/${showRepayModal}/repayments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(repayForm.amount),
          paidAt: repayForm.paidAt,
          method: repayForm.method,
          ...(repayForm.referenceId && { referenceId: repayForm.referenceId }),
          ...(repayForm.note && { note: repayForm.note }),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Repayment recorded");
      invalidate();
      fetchLoans();
      setShowRepayModal(null);
    } catch {
      toast.error("Failed to save repayment");
    } finally {
      setRepaySaving(false);
    }
  }

  async function deleteRepayConfirm(loanId: string, repayId: string) {
    setDeletingRepay(repayId);
    try {
      const res = await window.fetch(`/api/ledger/${loanId}/repayments?repaymentId=${repayId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Repayment deleted");
      invalidate();
      fetchLoans();
    } catch {
      toast.error("Failed to delete repayment");
    } finally {
      setDeletingRepay(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Outstanding Debt"
          value={PKR(totalDebt)}
          sub={`${loans.filter(l => l.status === "ACTIVE").length} active loans`}
          color="danger"
        />
        <SummaryCard
          label="Total Repaid"
          value={PKR(totalRepaidAll)}
          sub="All time"
          color="success"
        />
        <SummaryCard
          label="Total Borrowed"
          value={PKR(loans.reduce((s, l) => s + Number(l.principal), 0))}
          sub={`${loans.length} loans total`}
          color="neutral"
        />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div />
        {canCreate && (
          <Button onClick={openAddLoan} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Loan
          </Button>
        )}
      </div>

      {/* Loading */}
      {status === "loading" && !data && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {/* Empty */}
      {status === "success" && loans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-[var(--text-tertiary)]" />
          </div>
          <p className="text-[var(--text-secondary)] text-sm">No loans recorded yet</p>
          {canCreate && (
            <Button onClick={openAddLoan} variant="secondary" size="sm">Add your first loan</Button>
          )}
        </div>
      )}

      {/* Loan list */}
      <div className="space-y-3">
        {loans.map(loan => {
          const cfg = STATUS_CONFIG[loan.status] ?? STATUS_CONFIG.ACTIVE;
          const Icon = cfg.icon;
          const pct = Math.min(100, Number(loan.principal) > 0
            ? (loan.totalRepaid / Number(loan.principal)) * 100
            : 0
          );
          const isOpen = expanded.has(loan.id);

          return (
            <div key={loan.id} className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                onClick={() => toggleExpand(loan.id)}
              >
                <span className="text-[var(--text-tertiary)] flex-shrink-0">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-[var(--text-tertiary)]">{loan.loanNumber}</span>
                    <Badge variant={cfg.badge}>
                      <Icon className="w-3 h-3 mr-1" />{cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-sm">{loan.source}</span>
                    {loan.purpose && <span className="text-xs text-[var(--text-secondary)] truncate">{loan.purpose}</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--interactive-primary)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">{pct.toFixed(0)}% repaid</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 space-y-0.5 ml-2">
                  <div className="text-sm font-semibold text-[var(--color-danger-500)]">{PKR(loan.outstanding)}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">of {PKR(loan.principal)}</div>
                </div>

                <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                  {canCreate && loan.status === "ACTIVE" && (
                    <Button size="sm" variant="secondary" onClick={() => openRepay(loan.id)}>
                      + Repay
                    </Button>
                  )}
                  {canEdit && (
                    <Button size="sm" variant="ghost" onClick={() => openEditLoan(loan)}>Edit</Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteLoanConfirm(loan.id)}
                      loading={deletingLoan === loan.id}
                      className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-500)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-[var(--border-default)] px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-sm">
                    <Detail label="Principal"     value={PKR(loan.principal)} />
                    <Detail label="Interest Rate" value={loan.interestRate ? `${loan.interestRate}% p.a.` : "N/A"} />
                    <Detail label="Start Date"    value={format(parseISO(loan.startDate), "dd MMM yyyy")} />
                    <Detail label="Due Date"      value={loan.dueDate ? format(parseISO(loan.dueDate), "dd MMM yyyy") : "—"} />
                    <Detail label="Total Repaid"  value={PKR(loan.totalRepaid)} />
                    <Detail label="Outstanding"   value={PKR(loan.outstanding)} />
                    {loan.notes && <div className="col-span-2 sm:col-span-4"><Detail label="Notes" value={loan.notes} /></div>}
                  </div>

                  {loan.repayments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">Repayment History</p>
                      <div className="space-y-1.5">
                        {loan.repayments.map((r: LoanRepayment) => (
                          <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-hover)] text-sm">
                            <span className="text-[var(--text-secondary)]">{format(parseISO(r.paidAt), "dd MMM yyyy")}</span>
                            <span className="text-[var(--text-secondary)] text-xs">{r.method.replace(/_/g, " ")}</span>
                            {r.referenceId && <span className="font-mono text-xs text-[var(--text-tertiary)]">{r.referenceId}</span>}
                            {r.note && <span className="text-[var(--text-tertiary)] text-xs truncate max-w-[160px]">{r.note}</span>}
                            <span className="font-semibold ml-auto">{PKR(r.amount)}</span>
                            {canDelete && (
                              <button
                                onClick={() => deleteRepayConfirm(loan.id, r.id)}
                                disabled={deletingRepay === r.id}
                                className="cursor-pointer text-[var(--color-danger-500)] hover:opacity-70 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Loan Modal */}
      <Modal open={showLoanModal} onClose={() => setShowLoanModal(false)} title={editLoan ? "Edit Loan" : "Add Loan"}>
        <div className="space-y-4">
          <div>
            <InputLabel>Source / Lender *</InputLabel>
            <Input
              placeholder="e.g. HBL Bank, MCB, Ali Khan"
              value={loanForm.source}
              onChange={e => setLoanForm(f => ({ ...f, source: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Principal Amount (Rs.) *</InputLabel>
              <NumberInput
                value={loanForm.principal}
                onChange={e => setLoanForm(f => ({ ...f, principal: e.target.value }))}
                placeholder="500000"
              />
            </div>
            <div>
              <InputLabel>Interest Rate (% p.a.)</InputLabel>
              <NumberInput
                value={loanForm.interestRate}
                onChange={e => setLoanForm(f => ({ ...f, interestRate: e.target.value }))}
                placeholder="12.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Start Date *</InputLabel>
              <DateInput
                value={loanForm.startDate}
                onChange={e => setLoanForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <InputLabel>Due Date</InputLabel>
              <DateInput
                value={loanForm.dueDate}
                onChange={e => setLoanForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <InputLabel>Purpose</InputLabel>
            <Input
              placeholder="e.g. Office equipment, working capital"
              value={loanForm.purpose}
              onChange={e => setLoanForm(f => ({ ...f, purpose: e.target.value }))}
            />
          </div>
          {editLoan && (
            <div>
              <InputLabel>Status</InputLabel>
              <Select
                value={loanForm.editStatus}
                onValueChange={v => setLoanForm(f => ({ ...f, editStatus: v }))}
                options={STATUS_OPTIONS}
              />
            </div>
          )}
          <div>
            <InputLabel>Notes</InputLabel>
            <Input
              placeholder="Additional notes..."
              value={loanForm.notes}
              onChange={e => setLoanForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLoanModal(false)}>Cancel</Button>
            <Button onClick={saveLoan} loading={loanSaving}>{editLoan ? "Update" : "Create Loan"}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Repayment Modal */}
      <Modal open={!!showRepayModal} onClose={() => setShowRepayModal(null)} title="Record Repayment">
        <div className="space-y-4">
          <div>
            <InputLabel>Amount (Rs.) *</InputLabel>
            <NumberInput
              value={repayForm.amount}
              onChange={e => setRepayForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="50000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Date *</InputLabel>
              <DateInput
                value={repayForm.paidAt}
                onChange={e => setRepayForm(f => ({ ...f, paidAt: e.target.value }))}
              />
            </div>
            <div>
              <InputLabel>Method</InputLabel>
              <Select
                value={repayForm.method}
                onValueChange={v => setRepayForm(f => ({ ...f, method: v }))}
                options={METHOD_OPTIONS}
              />
            </div>
          </div>
          <div>
            <InputLabel>Reference / Transaction ID</InputLabel>
            <Input
              placeholder="TXN-12345"
              value={repayForm.referenceId}
              onChange={e => setRepayForm(f => ({ ...f, referenceId: e.target.value }))}
            />
          </div>
          <div>
            <InputLabel>Note</InputLabel>
            <Input
              placeholder="Optional note"
              value={repayForm.note}
              onChange={e => setRepayForm(f => ({ ...f, note: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRepayModal(null)}>Cancel</Button>
            <Button onClick={saveRepayment} loading={repaySaving}>Record Repayment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({
  label, value, sub, color,
}: {
  label: string; value: string; sub: string; color: "danger" | "success" | "neutral";
}) {
  const textColor = {
    danger:  "text-[var(--color-danger-500)]",
    success: "text-[var(--color-success-500)]",
    neutral: "text-[var(--text-primary)]",
  }[color];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4">
      <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${textColor}`}>{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{sub}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
