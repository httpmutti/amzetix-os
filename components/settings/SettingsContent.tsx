"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Building2, Users, DollarSign, Plug, AlertTriangle } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, InputLabel } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  daysAllowed: number;
  isPaid: boolean;
  isActive: boolean;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  recurring: boolean;
}

interface Settings {
  "company.name"?: string;
  "company.address"?: string;
  "company.currency"?: string;
  "company.timezone"?: string;
  "company.fiscalYearStart"?: number;
  "finance.paymentTerms"?: number;
  "finance.taxRate"?: number;
  "finance.bankName"?: string;
  "finance.bankAccount"?: string;
  "finance.bankSortCode"?: string;
  "integrations.resendKey"?: string;
  "integrations.stripeKey"?: string;
}

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "US Eastern (ET)" },
  { value: "America/Chicago", label: "US Central (CT)" },
  { value: "America/Denver", label: "US Mountain (MT)" },
  { value: "America/Los_Angeles", label: "US Pacific (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Asia/Karachi", label: "Pakistan (PKT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2024, i).toLocaleString("en-US", { month: "long" }),
}));

const TERMS_OPTIONS = [
  { value: "7", label: "Net 7 days" },
  { value: "14", label: "Net 14 days" },
  { value: "30", label: "Net 30 days" },
  { value: "45", label: "Net 45 days" },
  { value: "60", label: "Net 60 days" },
  { value: "90", label: "Net 90 days" },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{title}</h3>
      {children}
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-6 items-start py-4 border-b last:border-b-0" style={{ borderColor: "var(--border-default)" }}>
      <InputLabel className="pt-2 mb-0">{label}</InputLabel>
      <div>{children}</div>
    </div>
  );
}

// ─── Company Tab ─────────────────────────────────────────────────────────────
function CompanyTab({ settings, onSave }: { settings: Settings; onSave: (patch: Partial<Settings>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: (settings["company.name"] as string) ?? "",
    address: (settings["company.address"] as string) ?? "",
    currency: (settings["company.currency"] as string) ?? "USD",
    timezone: (settings["company.timezone"] as string) ?? "UTC",
    fiscalYearStart: String(settings["company.fiscalYearStart"] ?? 1),
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({
      "company.name": form.name || undefined,
      "company.address": form.address || undefined,
      "company.currency": form.currency,
      "company.timezone": form.timezone,
      "company.fiscalYearStart": parseInt(form.fiscalYearStart),
    });
    setSaving(false);
  }

  return (
    <Card>
      <FormRow label="Company name">
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Acme Agency" />
      </FormRow>
      <FormRow label="Address">
        <textarea
          value={form.address}
          onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
          rows={3}
          placeholder="123 Main St, City, Country"
          className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] bg-[var(--surface-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] outline-none transition-colors resize-none"
        />
      </FormRow>
      <FormRow label="Currency">
        <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))} options={CURRENCY_OPTIONS} />
      </FormRow>
      <FormRow label="Timezone">
        <Select value={form.timezone} onValueChange={v => setForm(p => ({ ...p, timezone: v }))} options={TIMEZONE_OPTIONS} />
      </FormRow>
      <FormRow label="Fiscal year start">
        <Select value={form.fiscalYearStart} onValueChange={v => setForm(p => ({ ...p, fiscalYearStart: v }))} options={MONTH_OPTIONS} />
      </FormRow>
      <div className="pt-4 flex justify-end">
        <Button loading={saving} onClick={save} icon={<Save size={14} />}>Save changes</Button>
      </div>
    </Card>
  );
}

// ─── Team Tab ────────────────────────────────────────────────────────────────
function TeamTab() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [ltModal, setLtModal] = useState(false);
  const [hdModal, setHdModal] = useState(false);
  const [ltForm, setLtForm] = useState({ name: "", daysAllowed: "14", isPaid: true });
  const [hdForm, setHdForm] = useState({ name: "", date: "", recurring: false });
  const [ltSaving, setLtSaving] = useState(false);
  const [hdSaving, setHdSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/leave-types").then(r => r.json()).then(j => setLeaveTypes(j.data ?? []));
    fetch("/api/settings/holidays").then(r => r.json()).then(j => setHolidays(j.data ?? []));
  }, []);

  async function addLeaveType() {
    setLtSaving(true);
    const res = await fetch("/api/settings/leave-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: ltForm.name, daysAllowed: parseInt(ltForm.daysAllowed), isPaid: ltForm.isPaid }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); }
    else { setLeaveTypes(p => [...p, json.data]); setLtModal(false); setLtForm({ name: "", daysAllowed: "14", isPaid: true }); toast.success("Leave type added"); }
    setLtSaving(false);
  }

  async function deleteLeaveType(id: string) {
    if (!confirm("Delete this leave type?")) return;
    const res = await fetch(`/api/settings/leave-types/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) toast.error(json.error ?? "Failed");
    else { setLeaveTypes(p => p.filter(l => l.id !== id)); toast.success("Deleted"); }
  }

  async function addHoliday() {
    setHdSaving(true);
    const res = await fetch("/api/settings/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hdForm),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Failed"); }
    else {
      setHolidays(p => [...p, json.data].sort((a, b) => a.date.localeCompare(b.date)));
      setHdModal(false);
      setHdForm({ name: "", date: "", recurring: false });
      toast.success("Holiday added");
    }
    setHdSaving(false);
  }

  async function deleteHoliday(id: string) {
    if (!confirm("Delete this holiday?")) return;
    await fetch(`/api/settings/holidays/${id}`, { method: "DELETE" });
    setHolidays(p => p.filter(h => h.id !== id));
    toast.success("Deleted");
  }

  return (
    <div className="space-y-6">
      {/* Leave Types */}
      <Card padding="none">
        <CardHeader className="px-5 py-4 border-b mb-0" style={{ borderColor: "var(--border-default)" }}>
          <CardTitle>Leave Types</CardTitle>
          <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setLtModal(true)}>Add</Button>
        </CardHeader>
        {leaveTypes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--text-secondary)" }}>No leave types yet.</p>
        ) : (
          <ul>
            {leaveTypes.map((lt, i) => (
              <li key={lt.id} className={`flex items-center justify-between gap-4 px-5 py-3.5 ${i < leaveTypes.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border-default)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{lt.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {lt.daysAllowed} days/year · {lt.isPaid ? "Paid" : "Unpaid"} · {lt.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => deleteLeaveType(lt.id)} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Holidays */}
      <Card padding="none">
        <CardHeader className="px-5 py-4 border-b mb-0" style={{ borderColor: "var(--border-default)" }}>
          <CardTitle>Public Holidays</CardTitle>
          <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setHdModal(true)}>Add</Button>
        </CardHeader>
        {holidays.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--text-secondary)" }}>No holidays added.</p>
        ) : (
          <ul>
            {holidays.map((hd, i) => (
              <li key={hd.id} className={`flex items-center justify-between gap-4 px-5 py-3.5 ${i < holidays.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border-default)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{hd.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {new Date(hd.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    {hd.recurring && " · Recurring"}
                  </p>
                </div>
                <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => deleteHoliday(hd.id)} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Leave Type Modal */}
      <Modal
        open={ltModal}
        onClose={() => setLtModal(false)}
        title="Add Leave Type"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setLtModal(false)}>Cancel</Button>
            <Button loading={ltSaving} onClick={addLeaveType}>Add Leave Type</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <InputLabel>Name</InputLabel>
            <Input value={ltForm.name} onChange={e => setLtForm(p => ({ ...p, name: e.target.value }))} placeholder="Annual Leave" />
          </div>
          <div>
            <InputLabel>Days allowed per year</InputLabel>
            <Input type="number" min="0" value={ltForm.daysAllowed} onChange={e => setLtForm(p => ({ ...p, daysAllowed: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="isPaid"
              type="checkbox"
              checked={ltForm.isPaid}
              onChange={e => setLtForm(p => ({ ...p, isPaid: e.target.checked }))}
              className="h-4 w-4 cursor-pointer"
            />
            <label htmlFor="isPaid" className="text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>Paid leave</label>
          </div>
        </div>
      </Modal>

      {/* Holiday Modal */}
      <Modal
        open={hdModal}
        onClose={() => setHdModal(false)}
        title="Add Public Holiday"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setHdModal(false)}>Cancel</Button>
            <Button loading={hdSaving} disabled={!hdForm.name || !hdForm.date} onClick={addHoliday}>Add Holiday</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <InputLabel>Holiday name</InputLabel>
            <Input value={hdForm.name} onChange={e => setHdForm(p => ({ ...p, name: e.target.value }))} placeholder="Christmas Day" />
          </div>
          <div>
            <InputLabel>Date</InputLabel>
            <Input type="date" value={hdForm.date} onChange={e => setHdForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="recurring"
              type="checkbox"
              checked={hdForm.recurring}
              onChange={e => setHdForm(p => ({ ...p, recurring: e.target.checked }))}
              className="h-4 w-4 cursor-pointer"
            />
            <label htmlFor="recurring" className="text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>Repeat annually</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────
function FinanceTab({ settings, onSave }: { settings: Settings; onSave: (patch: Partial<Settings>) => Promise<void> }) {
  const [form, setForm] = useState({
    paymentTerms: String(settings["finance.paymentTerms"] ?? 30),
    taxRate: String(settings["finance.taxRate"] ?? 0),
    bankName: (settings["finance.bankName"] as string) ?? "",
    bankAccount: (settings["finance.bankAccount"] as string) ?? "",
    bankSortCode: (settings["finance.bankSortCode"] as string) ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({
      "finance.paymentTerms": parseInt(form.paymentTerms),
      "finance.taxRate": parseFloat(form.taxRate),
      "finance.bankName": form.bankName || undefined,
      "finance.bankAccount": form.bankAccount || undefined,
      "finance.bankSortCode": form.bankSortCode || undefined,
    });
    setSaving(false);
  }

  return (
    <Card>
      <FormRow label="Default payment terms">
        <Select value={form.paymentTerms} onValueChange={v => setForm(p => ({ ...p, paymentTerms: v }))} options={TERMS_OPTIONS} />
      </FormRow>
      <FormRow label="Default tax rate (%)">
        <Input type="number" min="0" max="100" step="0.1" value={form.taxRate} onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))} placeholder="0" className="w-32" />
      </FormRow>
      <FormRow label="Bank name">
        <Input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} placeholder="HSBC" />
      </FormRow>
      <FormRow label="Account number">
        <Input value={form.bankAccount} onChange={e => setForm(p => ({ ...p, bankAccount: e.target.value }))} placeholder="12345678" />
      </FormRow>
      <FormRow label="Sort code / routing">
        <Input value={form.bankSortCode} onChange={e => setForm(p => ({ ...p, bankSortCode: e.target.value }))} placeholder="12-34-56" />
      </FormRow>
      <div className="pt-4 flex justify-end">
        <Button loading={saving} onClick={save} icon={<Save size={14} />}>Save changes</Button>
      </div>
    </Card>
  );
}

// ─── Integrations Tab ────────────────────────────────────────────────────────
function IntegrationsTab({ settings, onSave }: { settings: Settings; onSave: (patch: Partial<Settings>) => Promise<void> }) {
  const [form, setForm] = useState({
    resendKey: (settings["integrations.resendKey"] as string) ?? "",
    stripeKey: (settings["integrations.stripeKey"] as string) ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({
      "integrations.resendKey": form.resendKey || undefined,
      "integrations.stripeKey": form.stripeKey || undefined,
    });
    setSaving(false);
  }

  return (
    <Card>
      <div className="mb-4 px-4 py-3 rounded-[var(--radius-md)] text-sm" style={{ background: "var(--surface-page)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
        API keys are stored in the database. Do not share them. They are only shown here — they are not sent to any third-party without explicit usage.
      </div>
      <FormRow label="Resend API key">
        <Input type="password" value={form.resendKey} onChange={e => setForm(p => ({ ...p, resendKey: e.target.value }))} placeholder="re_••••••••••••••••" autoComplete="off" />
        <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>Used for sending invoice emails and notifications.</p>
      </FormRow>
      <FormRow label="Stripe payment link">
        <Input type="password" value={form.stripeKey} onChange={e => setForm(p => ({ ...p, stripeKey: e.target.value }))} placeholder="sk_••••••••••••••••" autoComplete="off" />
        <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>Used for online invoice payment links.</p>
      </FormRow>
      <div className="pt-4 flex justify-end">
        <Button loading={saving} onClick={save} icon={<Save size={14} />}>Save keys</Button>
      </div>
    </Card>
  );
}

// ─── Danger Zone Tab ─────────────────────────────────────────────────────────
function DangerZoneTab({ userRole }: { userRole: string }) {
  const isOwner = userRole === "OWNER";

  async function exportData() {
    const res = await fetch("/api/audit-logs?export=csv");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agency-os-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Export audit logs</h4>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Download a full CSV of all audit log entries.</p>
          </div>
          <Button variant="secondary" icon={<AlertTriangle size={14} />} onClick={exportData} disabled={!isOwner}>
            Export CSV
          </Button>
        </div>
      </Card>
      {!isOwner && (
        <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>Only the Owner can access danger zone actions.</p>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "finance", label: "Finance", icon: DollarSign },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export function SettingsContent({ initialSettings, userRole }: { initialSettings: Settings; userRole: string }) {
  const [activeTab, setActiveTab] = useState("company");
  const [settings, setSettings] = useState<Settings>(initialSettings);

  async function handleSave(patch: Partial<Settings>) {
    const filtered = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    );
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtered),
    });
    if (res.ok) {
      setSettings(prev => ({ ...prev, ...filtered }));
      toast.success("Settings saved");
    } else {
      const j = await res.json();
      toast.error(j.error ?? "Failed to save");
    }
  }

  return (
    <div className="space-y-6">
      <Tabs
        tabs={TABS.map(t => ({ id: t.id, label: t.label }))}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div>
        {activeTab === "company" && <CompanyTab settings={settings} onSave={handleSave} />}
        {activeTab === "team" && <TeamTab />}
        {activeTab === "finance" && <FinanceTab settings={settings} onSave={handleSave} />}
        {activeTab === "integrations" && <IntegrationsTab settings={settings} onSave={handleSave} />}
        {activeTab === "danger" && <DangerZoneTab userRole={userRole} />}
      </div>
    </div>
  );
}
