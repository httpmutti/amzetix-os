"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2, Mail, Phone, Globe, MapPin, CreditCard,
  Plus, Trash2, Star, CheckCircle2, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Input, InputLabel } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatRelative } from "@/lib/utils";
import { ClientModal } from "./ClientModal";
import { useClientsStore } from "@/lib/store/clients.store";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
}

interface Project {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  issueDate: string | null;
}

interface Onboarding {
  id: string;
  step: number;
  notes: string | null;
  completedAt: string | null;
  kickoffDate: string | null;
}

interface ClientFull {
  id: string;
  clientId: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  billingEmail: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
  website: string | null;
  currency: string;
  paymentTerms: number;
  status: string;
  notes: string | null;
  tags: string[];
  startDate: string | null;
  contacts: Contact[];
  projects: Project[];
  invoices: Invoice[];
  onboarding: Onboarding | null;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "active", ONBOARDING: "in-progress", LEAD: "draft",
  PAUSED: "pending", COMPLETED: "completed", LOST: "lost",
};

const PROJECT_STATUS_BADGE: Record<string, string> = {
  ACTIVE: "active", COMPLETED: "completed", ON_HOLD: "pending",
  PLANNING: "draft", CANCELLED: "lost",
};

const INVOICE_STATUS_BADGE: Record<string, string> = {
  DRAFT: "draft", SENT: "in-progress", PARTIALLY_PAID: "pending",
  PAID: "active", OVERDUE: "lost", CANCELLED: "lost",
};

// ─── Detail page ─────────────────────────────────────────────────────────────

interface ClientDetailProps {
  clientId: string;
  canEdit: boolean;
}

export function ClientDetail({ clientId, canEdit }: ClientDetailProps) {
  const [client, setClient] = useState<ClientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const { invalidate } = useClientsStore();

  const loadClient = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const json = await res.json();
      setClient(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClient(); }, [clientId]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "contacts", label: "Contacts", count: client?.contacts.length },
    { id: "projects", label: "Projects", count: client?.projects.length },
    { id: "invoices", label: "Invoices", count: client?.invoices.length },
    { id: "onboarding", label: "Onboarding" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[var(--text-tertiary)]">Client not found.</p>
        <Link href="/clients" className="text-sm text-[var(--text-brand)] hover:underline mt-2 inline-block">
          ← Back to clients
        </Link>
      </div>
    );
  }

  const totalInvoiced = client.invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = client.invoices.reduce((s, i) => s + Number(i.amountPaid), 0);

  return (
    <>
      {/* Header card */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-[var(--radius-lg)] bg-[var(--interactive-primary)] flex items-center justify-center text-[var(--text-on-primary)] font-bold text-lg shrink-0">
              {client.companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">{client.companyName}</h1>
                <span className="text-xs text-[var(--text-tertiary)] font-mono">{client.clientId}</span>
                <Badge variant={STATUS_BADGE[client.status] as never || "default"}>
                  {client.status.charAt(0) + client.status.slice(1).toLowerCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
                    <Mail size={11} /> {client.email}
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
                    <Phone size={11} /> {client.phone}
                  </a>
                )}
                {client.country && (
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                    <MapPin size={11} /> {client.country}
                  </span>
                )}
                {client.website && (
                  <a href={client.website} target="_blank" rel="noreferrer" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
                    <Globe size={11} /> {client.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Total Invoiced</p>
            <p className="text-base font-semibold text-[var(--text-primary)]">{formatCurrency(totalInvoiced, client.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Total Paid</p>
            <p className="text-base font-semibold text-[var(--color-success-600)]">{formatCurrency(totalPaid, client.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Outstanding</p>
            <p className="text-base font-semibold text-[var(--color-warning-600)]">{formatCurrency(totalInvoiced - totalPaid, client.currency)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === "overview" && <OverviewTab client={client} />}
        {activeTab === "contacts" && <ContactsTab client={client} canEdit={canEdit} onRefresh={loadClient} />}
        {activeTab === "projects" && <ProjectsTab projects={client.projects} />}
        {activeTab === "invoices" && <InvoicesTab invoices={client.invoices} currency={client.currency} />}
        {activeTab === "onboarding" && <OnboardingTab client={client} canEdit={canEdit} onRefresh={loadClient} />}
      </div>

      <ClientModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          invalidate();
          loadClient();
        }}
        client={{
          id: client.id,
          clientId: client.clientId,
          companyName: client.companyName,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
          country: client.country,
          currency: client.currency,
          status: client.status as never,
          startDate: client.startDate,
          createdAt: "",
          _count: { projects: client.projects.length, invoices: client.invoices.length },
        }}
      />
    </>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ client }: { client: ClientFull }) {
  const fields: { label: string; value: string | null | undefined }[] = [
    { label: "Contact Person", value: client.contactPerson },
    { label: "Email", value: client.email },
    { label: "Billing Email", value: client.billingEmail },
    { label: "Phone", value: client.phone },
    { label: "Country", value: client.country },
    { label: "Address", value: client.address },
    { label: "Website", value: client.website },
    { label: "Currency", value: client.currency },
    { label: "Payment Terms", value: client.paymentTerms ? `Net ${client.paymentTerms}` : null },
    { label: "Client Since", value: client.startDate ? new Date(client.startDate).toLocaleDateString() : null },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Details</h3>
        <dl className="space-y-2">
          {fields.map(({ label, value }) => value ? (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-xs text-[var(--text-tertiary)] shrink-0">{label}</dt>
              <dd className="text-xs text-[var(--text-primary)] text-right">{value}</dd>
            </div>
          ) : null)}
        </dl>
      </div>

      {client.notes && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Notes</h3>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {client.tags.length > 0 && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {client.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-neutral-100)] text-[var(--text-secondary)]">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contacts tab ─────────────────────────────────────────────────────────────

function ContactsTab({ client, canEdit, onRefresh }: { client: ClientFull; canEdit: boolean; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  const saveContact = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined, role: role || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success("Contact added");
      setAdding(false);
      setName(""); setEmail(""); setPhone(""); setRole("");
      onRefresh();
    } catch {
      toast.error("Failed to add contact");
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm("Remove this contact?")) return;
    try {
      await fetch(`/api/clients/${client.id}/contacts/${contactId}`, { method: "DELETE" });
      toast.success("Contact removed");
      onRefresh();
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Contacts</h3>
        {canEdit && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} className="mr-1" /> Add
          </Button>
        )}
      </div>

      {adding && (
        <div className="p-4 border-b border-[var(--border-default)] bg-[var(--surface-bg)]">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <InputLabel htmlFor="c-name">Name *</InputLabel>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div>
              <InputLabel htmlFor="c-role">Role</InputLabel>
              <Input id="c-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="CEO, PM…" />
            </div>
            <div>
              <InputLabel htmlFor="c-email">Email</InputLabel>
              <Input id="c-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
            </div>
            <div>
              <InputLabel htmlFor="c-phone">Phone</InputLabel>
              <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={saving} onClick={saveContact}>Save</Button>
            <Button variant="secondary" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {client.contacts.length === 0 && !adding ? (
        <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No contacts yet.</p>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          {client.contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[var(--color-neutral-200)] flex items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{c.name}</span>
                    {c.isPrimary && <Star size={11} className="text-[var(--color-warning-500)]" fill="currentColor" />}
                    {c.role && <span className="text-xs text-[var(--text-tertiary)]">· {c.role}</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {c.email && <a href={`mailto:${c.email}`} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{c.email}</a>}
                    {c.phone && <span className="text-xs text-[var(--text-tertiary)]">{c.phone}</span>}
                  </div>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => deleteContact(c.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-danger-500)] transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Projects tab ──────────────────────────────────────────────────────────────

function ProjectsTab({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-10 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">No projects yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="divide-y divide-[var(--border-subtle)]">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Clock size={15} className="text-[var(--text-tertiary)] shrink-0" />
              <div>
                <Link href={`/projects/${p.id}`} className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-brand)]">
                  {p.name}
                </Link>
                {p.dueDate && (
                  <p className="text-xs text-[var(--text-tertiary)]">Due {new Date(p.dueDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <Badge variant={PROJECT_STATUS_BADGE[p.status] as never || "default"}>
              {p.status.replace(/_/g, " ")}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Invoices tab ─────────────────────────────────────────────────────────────

function InvoicesTab({ invoices, currency }: { invoices: Invoice[]; currency: string }) {
  if (invoices.length === 0) {
    return (
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-10 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">No invoices yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              {["Invoice #", "Date", "Total", "Paid", "Balance", "Status"].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[var(--interactive-secondary-hover)]">
                <td className="px-3 py-3">
                  <Link href={`/invoices/${inv.id}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--text-brand)] font-mono text-xs">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="px-3 py-3 text-[var(--text-tertiary)] text-xs">
                  {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-3 font-medium tabular-nums">{formatCurrency(Number(inv.total), currency)}</td>
                <td className="px-3 py-3 text-[var(--color-success-600)] tabular-nums">{formatCurrency(Number(inv.amountPaid), currency)}</td>
                <td className="px-3 py-3 text-[var(--color-warning-600)] tabular-nums">{formatCurrency(Number(inv.balanceDue), currency)}</td>
                <td className="px-3 py-3">
                  <Badge variant={INVOICE_STATUS_BADGE[inv.status] as never || "default"}>
                    {inv.status.replace(/_/g, " ")}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Onboarding tab ───────────────────────────────────────────────────────────

function OnboardingTab({ client, canEdit, onRefresh }: { client: ClientFull; canEdit: boolean; onRefresh: () => void }) {
  const onboarding = client.onboarding;
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(onboarding?.notes ?? "");

  const steps = [
    "Initial consultation",
    "Contract signed",
    "Onboarding questionnaire",
    "Kickoff meeting",
    "Access & credentials shared",
    "Project kick-off",
  ];

  const currentStep = onboarding?.step ?? 0;

  const advanceStep = async () => {
    if (currentStep >= steps.length) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: currentStep + 1, notes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Progress saved");
      onRefresh();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Onboarding Steps</h3>
        <ol className="space-y-2">
          {steps.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <li key={step} className={`flex items-center gap-2.5 text-sm ${done ? "text-[var(--color-success-600)]" : active ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-tertiary)]"}`}>
                <CheckCircle2 size={15} className={done ? "text-[var(--color-success-600)]" : "text-[var(--border-default)]"} />
                {step}
              </li>
            );
          })}
        </ol>
        {canEdit && currentStep < steps.length && (
          <Button variant="primary" size="sm" className="mt-4 w-full" loading={saving} onClick={advanceStep}>
            Mark step {currentStep + 1} complete
          </Button>
        )}
        {currentStep >= steps.length && (
          <p className="text-xs text-[var(--color-success-600)] font-medium mt-4 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> All steps completed
          </p>
        )}
      </div>

      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          readOnly={!canEdit}
          rows={6}
          placeholder="Onboarding notes…"
          className="w-full text-sm resize-none bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--interactive-primary)] focus:border-transparent"
        />
        {canEdit && (
          <Button variant="secondary" size="sm" className="mt-2" loading={saving} onClick={advanceStep}>Save notes</Button>
        )}
      </div>
    </div>
  );
}
