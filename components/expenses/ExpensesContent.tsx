"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, Plus, Trash2, Edit2, Receipt, RefreshCw, PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { InputLabel } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { NumberInput } from "@/components/ui/number-input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useExpensesStore } from "@/lib/store/expenses.store";
import type { Expense } from "@/lib/store/expenses.store";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "SALARIES", label: "Salaries" },
  { value: "FREELANCERS", label: "Freelancers" },
  { value: "SOFTWARE", label: "Software" },
  { value: "HOSTING", label: "Hosting" },
  { value: "DOMAINS", label: "Domains" },
  { value: "MARKETING", label: "Marketing" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "OFFICE", label: "Office" },
  { value: "INTERNET", label: "Internet" },
  { value: "PHONE", label: "Phone" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "TRAVEL", label: "Travel" },
  { value: "BANK_FEES", label: "Bank Fees" },
  { value: "PAYMENT_PROCESSING", label: "Payment Processing" },
  { value: "PROFESSIONAL_SERVICES", label: "Professional Services" },
  { value: "TAXES", label: "Taxes" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_CREATE_OPTIONS = CATEGORY_OPTIONS.slice(1);

const METHOD_OPTIONS = [
  { value: "", label: "No method" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "pending", APPROVED: "active", REJECTED: "lost", PAID: "completed",
};

const CHART_COLORS = [
  "var(--color-info-400)", "var(--color-warning-500)", "var(--color-danger-500)",
  "var(--color-success-500)", "var(--interactive-primary)", "var(--color-neutral-400)",
  "var(--color-info-600)", "var(--color-warning-400)",
];

const PAGE_SIZE = 15;

const currencyOptions = [
  { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" },
  { value: "PKR", label: "PKR" }, { value: "AED", label: "AED" },
];

const FREQUENCY_LABEL: Record<string, string> = {
  MONTHLY: "Monthly", QUARTERLY: "Quarterly", YEARLY: "Yearly", CUSTOM: "Custom",
};

const FREQ_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

interface RecurringSub {
  id: string;
  vendor?: string | null;
  description: string;
  category: string;
  amount: number | string;
  currency: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  nextDate: string;
  isActive: boolean;
  notes?: string | null;
}

interface Props {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function ExpensesContent({ canCreate, canEdit, canDelete }: Props) {
  const { data, status, fetch, mutate } = useExpensesStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    vendor: "", description: "", category: "OTHER",
    amount: 0 as number | undefined,
    currency: "USD", method: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Subscriptions tab
  const [activeTab, setActiveTab] = useState<"expenses" | "subscriptions">("expenses");
  const [subs, setSubs] = useState<RecurringSub[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subModal, setSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<RecurringSub | null>(null);
  const [subForm, setSubForm] = useState({
    vendor: "", description: "", category: "SOFTWARE", amount: 0 as number | undefined,
    currency: "PKR", frequency: "MONTHLY", startDate: new Date().toISOString().slice(0, 10),
    endDate: "", notes: "",
  });
  const [subSubmitting, setSubSubmitting] = useState(false);

  const fetchSubs = useCallback(async () => {
    setSubsLoading(true);
    const res = await window.fetch("/api/expenses/recurring");
    const json = await res.json();
    setSubs(json.data ?? []);
    setSubsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { if (activeTab === "subscriptions") fetchSubs(); }, [activeTab, fetchSubs]);
  useEffect(() => { setPage(1); }, [search, category]);

  const loading = status === "idle" || status === "loading";
  const all = data ?? [];

  const filtered = useMemo(() => all.filter((exp) => {
    if (category && exp.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return exp.description.toLowerCase().includes(q) || (exp.vendor?.toLowerCase().includes(q) ?? false);
    }
    return true;
  }), [all, search, category]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const expenses = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalAmount = filtered.reduce((s, e) => s + Number(e.amount), 0);

  // Current month category stats computed client-side
  const categoryStats = useMemo(() => {
    const now = new Date();
    const thisMonth = all.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const stats: Record<string, { total: number; count: number }> = {};
    thisMonth.forEach((e) => {
      if (!stats[e.category]) stats[e.category] = { total: 0, count: 0 };
      stats[e.category].total += Number(e.amount);
      stats[e.category].count += 1;
    });
    return Object.entries(stats).map(([category, s]) => ({ category, ...s }));
  }, [all]);

  const openCreate = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), vendor: "", description: "", category: "OTHER", amount: undefined, currency: "USD", method: "", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditing(exp);
    setForm({
      date: exp.date.slice(0, 10),
      vendor: exp.vendor ?? "",
      description: exp.description,
      category: exp.category,
      amount: Number(exp.amount),
      currency: exp.currency,
      method: exp.method ?? "",
      notes: exp.notes ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    if (!form.amount || form.amount <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmitting(true);
    const payload = {
      date: form.date, vendor: form.vendor || undefined, description: form.description,
      category: form.category, amount: form.amount, currency: form.currency,
      method: form.method || undefined, notes: form.notes || undefined,
    };
    let res: Response;
    if (editing) {
      res = await window.fetch(`/api/expenses/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      res = await window.fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    const json = await res.json();
    if (res.ok) {
      toast.success(editing ? "Expense updated" : "Expense added");
      setModalOpen(false);
      const saved: Expense = json.data ?? json;
      if (editing) {
        mutate((list) => list.map((e) => e.id === editing.id ? saved : e));
      } else {
        mutate((list) => [saved, ...list]);
      }
    } else {
      toast.error(json.error ?? "Failed");
    }
    setSubmitting(false);
  };

  const handleDelete = async (exp: Expense) => {
    if (!confirm(`Delete expense "${exp.description}"?`)) return;
    const res = await window.fetch(`/api/expenses/${exp.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Expense deleted");
      mutate((list) => list.filter((e) => e.id !== exp.id));
    } else {
      toast.error("Failed");
    }
  };

  const openSubCreate = () => {
    setEditingSub(null);
    setSubForm({ vendor: "", description: "", category: "SOFTWARE", amount: undefined, currency: "PKR", frequency: "MONTHLY", startDate: new Date().toISOString().slice(0, 10), endDate: "", notes: "" });
    setSubModal(true);
  };

  const openSubEdit = (sub: RecurringSub) => {
    setEditingSub(sub);
    setSubForm({
      vendor: sub.vendor ?? "",
      description: sub.description,
      category: sub.category,
      amount: Number(sub.amount),
      currency: sub.currency,
      frequency: sub.frequency,
      startDate: sub.startDate.slice(0, 10),
      endDate: sub.endDate?.slice(0, 10) ?? "",
      notes: sub.notes ?? "",
    });
    setSubModal(true);
  };

  const handleSubSubmit = async () => {
    if (!subForm.description.trim()) { toast.error("Description required"); return; }
    if (!subForm.amount || subForm.amount <= 0) { toast.error("Amount required"); return; }
    setSubSubmitting(true);
    const payload = { ...subForm, amount: subForm.amount, endDate: subForm.endDate || undefined };
    let res: Response;
    if (editingSub) {
      res = await window.fetch(`/api/expenses/recurring/${editingSub.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      res = await window.fetch("/api/expenses/recurring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    const json = await res.json();
    if (res.ok) {
      toast.success(editingSub ? "Subscription updated" : "Subscription added");
      setSubModal(false);
      fetchSubs();
    } else {
      toast.error(json.error ?? "Failed");
    }
    setSubSubmitting(false);
  };

  const handleSubDelete = async (sub: RecurringSub) => {
    if (!confirm(`Delete subscription "${sub.description}"?`)) return;
    await window.fetch(`/api/expenses/recurring/${sub.id}`, { method: "DELETE" });
    toast.success("Subscription removed");
    setSubs(prev => prev.filter(s => s.id !== sub.id));
  };

  const handleSubToggle = async (sub: RecurringSub) => {
    const res = await window.fetch(`/api/expenses/recurring/${sub.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !sub.isActive }),
    });
    if (res.ok) {
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, isActive: !s.isActive } : s));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab toggle */}
      <div className="flex items-center gap-1 border-b border-[var(--border-default)] pb-0 -mb-2">
        {(["expenses", "subscriptions"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-[var(--interactive-primary)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          >
            {tab === "subscriptions" ? "Subscriptions / Tools" : "Expenses"}
          </button>
        ))}
      </div>

      {/* ── Subscriptions tab ── */}
      {activeTab === "subscriptions" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                Recurring tool subscriptions and services. Active: {subs.filter(s => s.isActive).length} · Monthly spend: {formatCurrency(subs.filter(s => s.isActive && s.frequency === "MONTHLY").reduce((a, s) => a + Number(s.amount), 0), "PKR")}
              </p>
            </div>
            {canCreate && <Button size="sm" onClick={openSubCreate}><Plus size={14} /> Add Subscription</Button>}
          </div>
          {subsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] py-12">
              <RefreshCw size={28} className="text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">No subscriptions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                    {["Tool / Service", "Category", "Amount", "Frequency", "Next Renewal", "Status", ""].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.map(sub => (
                    <tr key={sub.id} className={`group border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0 hover:bg-[var(--interactive-secondary-hover)] transition-colors ${!sub.isActive ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{sub.vendor || sub.description}</p>
                        {sub.vendor && <p className="text-xs text-[var(--text-tertiary)]">{sub.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{sub.category.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 tabular-nums font-medium text-[var(--text-primary)]">{formatCurrency(Number(sub.amount), sub.currency)}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{FREQUENCY_LABEL[sub.frequency] ?? sub.frequency}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">{format(new Date(sub.nextDate), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">
                        <Badge variant={sub.isActive ? "active" : "draft"}>{sub.isActive ? "Active" : "Paused"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => handleSubToggle(sub)} title={sub.isActive ? "Pause" : "Resume"} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors">
                            {sub.isActive ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                          </button>
                          {canEdit && <button type="button" onClick={() => openSubEdit(sub)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={13} /></button>}
                          {canDelete && <button type="button" onClick={() => handleSubDelete(sub)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--color-danger-500)] transition-colors"><Trash2 size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Expenses tab ── */}
      {activeTab === "expenses" && <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                <Input placeholder="Search expenses…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
              </div>
              <div className="w-44">
                <Select value={category} onValueChange={setCategory} options={CATEGORY_OPTIONS} />
              </div>
              {canCreate && <Button size="sm" onClick={openCreate}><Plus size={14} /> Add Expense</Button>}
            </div>

            {total > 0 && (
              <p className="text-xs text-[var(--text-secondary)]">
                {total} expenses · Total: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(totalAmount, "USD")}</span>
              </p>
            )}

            {loading ? (
              <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] py-12">
                <Receipt size={28} className="text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--text-secondary)]">No expenses found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                        {["#","Date","Vendor","Description","Category","Amount","Status",""].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.id} className="group border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0 hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)]">{exp.expenseId}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{format(new Date(exp.date), "MMM d, yyyy")}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">{exp.vendor ?? "—"}</td>
                          <td className="px-4 py-3 text-[var(--text-primary)] max-w-[200px] truncate">{exp.description}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{exp.category.replace(/_/g, " ")}</td>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)] tabular-nums whitespace-nowrap">{formatCurrency(Number(exp.amount), exp.currency)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={(STATUS_BADGE[exp.status] ?? "default") as never}>{exp.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canEdit && <button type="button" onClick={() => openEdit(exp)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={13} /></button>}
                              {canDelete && <button type="button" onClick={() => handleDelete(exp)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--color-danger-500)] transition-colors"><Trash2 size={13} /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>

        {categoryStats.length > 0 && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">This Month by Category</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryStats} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {categoryStats.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, ""]} contentStyle={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--text-primary)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {categoryStats.slice(0, 6).map((s, i) => (
                <div key={s.category} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-[var(--text-secondary)]">{s.category.replace(/_/g, " ")}</span>
                  </div>
                  <span className="font-medium text-[var(--text-primary)] tabular-nums">${s.total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>}

      {/* Subscription Add/Edit Modal */}
      <Modal open={subModal} onClose={() => setSubModal(false)} title={editingSub ? "Edit Subscription" : "Add Subscription"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Tool / Vendor Name</InputLabel>
              <Input value={subForm.vendor} onChange={e => setSubForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Slack, Notion, GitHub…" />
            </div>
            <div>
              <InputLabel>Description</InputLabel>
              <Input value={subForm.description} onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))} placeholder="Plan or use case" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Category</InputLabel>
              <Select value={subForm.category} onValueChange={v => setSubForm(f => ({ ...f, category: v }))} options={CATEGORY_CREATE_OPTIONS} />
            </div>
            <div>
              <InputLabel>Frequency</InputLabel>
              <Select value={subForm.frequency} onValueChange={v => setSubForm(f => ({ ...f, frequency: v }))} options={FREQ_OPTIONS} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Amount</InputLabel>
              <NumberInput value={subForm.amount} onChange={e => setSubForm(f => ({ ...f, amount: +e.target.value || 0 }))} min={0} step={1} />
            </div>
            <div>
              <InputLabel>Currency</InputLabel>
              <Select value={subForm.currency} onValueChange={v => setSubForm(f => ({ ...f, currency: v }))} options={currencyOptions} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Start Date</InputLabel>
              <DateInput value={subForm.startDate} onChange={e => setSubForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <InputLabel>End Date (optional)</InputLabel>
              <DateInput value={subForm.endDate} onChange={e => setSubForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <InputLabel>Notes</InputLabel>
            <Input value={subForm.notes} onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setSubModal(false)}>Cancel</Button>
            <Button onClick={handleSubSubmit} loading={subSubmitting}>{editingSub ? "Save Changes" : "Add Subscription"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Expense" : "Add Expense"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Date</InputLabel>
              <DateInput value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <InputLabel>Amount</InputLabel>
              <NumberInput value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value || 0 }))} min={0} step={0.01} />
            </div>
          </div>
          <div>
            <InputLabel>Description</InputLabel>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this expense for?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Vendor</InputLabel>
              <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" />
            </div>
            <div>
              <InputLabel>Category</InputLabel>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))} options={CATEGORY_CREATE_OPTIONS} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Currency</InputLabel>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))} options={currencyOptions} />
            </div>
            <div>
              <InputLabel>Payment Method</InputLabel>
              <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))} options={METHOD_OPTIONS} />
            </div>
          </div>
          <div>
            <InputLabel>Notes</InputLabel>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editing ? "Save Changes" : "Add Expense"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
