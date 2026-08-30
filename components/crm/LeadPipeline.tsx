"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Globe, ChevronDown } from "lucide-react";
import { formatCurrency, formatRelative } from "@/lib/utils";
import { useCRMStore, type Lead } from "@/lib/store/crm.store";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const COLUMNS: { status: string; label: string; color: string }[] = [
  { status: "NEW_LEAD",      label: "New Lead",      color: "var(--color-warning-400)" },
  { status: "CONTACTED",     label: "Contacted",     color: "var(--color-info-400)" },
  { status: "QUALIFIED",     label: "Qualified",     color: "var(--color-success-400)" },
  { status: "PROPOSAL_SENT", label: "Proposal Sent", color: "var(--color-info-500)" },
  { status: "NEGOTIATION",   label: "Negotiation",   color: "var(--color-warning-500)" },
];

const ALL_STATUSES = [
  ...COLUMNS,
  { status: "WON",  label: "Won",  color: "var(--color-success-500)" },
  { status: "LOST", label: "Lost", color: "var(--color-danger-400)" },
];

function serviceLabel(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Lead card ───────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  columnColor: string;
  onClick: () => void;
}

function LeadCard({ lead, columnColor, onClick }: LeadCardProps) {
  const { invalidate } = useCRMStore();
  const [moving, setMoving] = useState(false);

  const currentCol = ALL_STATUSES.find((s) => s.status === lead.status);

  const moveStatus = async (newStatus: string) => {
    setMoving(true);
    const res = await fetch(`/api/crm/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setMoving(false);
    if (res.ok) {
      invalidate();
      useCRMStore.getState().fetch();
    } else {
      toast.error("Failed to update status");
    }
  };

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] cursor-pointer group transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
    >
      {/* Left accent stripe */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[var(--radius-lg)]"
        style={{ background: columnColor }}
      />

      <div className="pl-4 pr-3 pt-3 pb-3">
        {/* Row 1: Name + value */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight truncate">
            {lead.name}
          </p>
          {lead.estimatedValue ? (
            <span
              className="shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-sm)]"
              style={{
                background: "var(--interactive-primary-bg)",
                color: "var(--text-brand)",
              }}
            >
              {formatCurrency(lead.estimatedValue, lead.currency, true)}
            </span>
          ) : null}
        </div>

        {/* Row 2: Company */}
        {lead.company && (
          <p className="text-xs text-[var(--text-secondary)] truncate mb-2.5">
            {lead.company}
          </p>
        )}

        {/* Row 3: Service chip + contact icons */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {lead.service ? (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-[130px]"
              style={{
                background: "var(--interactive-primary-bg)",
                color: "var(--text-tertiary)",
                letterSpacing: "0.02em",
              }}
            >
              {serviceLabel(lead.service)}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                title={lead.email}
                className="h-5 w-5 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-secondary-hover)] transition-colors"
              >
                <Mail size={11} />
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                title={lead.phone}
                className="h-5 w-5 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-secondary-hover)] transition-colors"
              >
                <Phone size={11} />
              </a>
            )}
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                title={lead.website}
                className="h-5 w-5 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-secondary-hover)] transition-colors"
              >
                <Globe size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-subtle)] -mx-3 mb-2.5" />

        {/* Row 4: Time + status dropdown */}
        <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {formatRelative(lead.createdAt)}
          </span>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                disabled={moving}
                className="flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 transition-colors cursor-pointer"
                style={{
                  background: "var(--interactive-primary-bg)",
                  color: "var(--text-secondary)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: currentCol?.color ?? "var(--text-tertiary)" }}
                />
                {currentCol?.label ?? lead.status}
                <ChevronDown size={10} className="shrink-0 opacity-60" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="bottom"
                align="end"
                sideOffset={4}
                className="z-50 min-w-[140px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[var(--shadow-md)] py-1 overflow-hidden"
              >
                {ALL_STATUSES.map((s) => (
                  <DropdownMenu.Item
                    key={s.status}
                    onSelect={() => moveStatus(s.status)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-secondary-hover)] cursor-pointer outline-none transition-colors"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: s.color }}
                    />
                    {s.label}
                    {s.status === lead.status && (
                      <span className="ml-auto text-[var(--text-brand)]">✓</span>
                    )}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

interface LeadPipelineProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
}

export function LeadPipeline({ leads, onEditLead }: LeadPipelineProps) {
  const activeLeads = leads.filter((l) => !["WON", "LOST"].includes(l.status));

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "400px" }}>
      {COLUMNS.map((col) => {
        const colLeads = activeLeads.filter((l) => l.status === col.status);
        const colValue = colLeads.reduce((s, l) => s + (l.estimatedValue ?? 0), 0);

        return (
          <div key={col.status} className="flex-none w-[240px]">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: col.color }} />
                <span className="text-xs font-semibold text-[var(--text-primary)]">{col.label}</span>
                <span
                  className="text-[10px] font-semibold rounded-full px-1.5 py-0.5"
                  style={{
                    background: "var(--interactive-primary-bg)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {colLeads.length}
                </span>
              </div>
              {colValue > 0 && (
                <span className="text-[10px] font-medium text-[var(--text-tertiary)]">
                  {formatCurrency(colValue, "USD", true)}
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {colLeads.length === 0 ? (
                <div className="border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 text-center">
                  <p className="text-xs text-[var(--text-tertiary)]">No leads</p>
                </div>
              ) : (
                colLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    columnColor={col.color}
                    onClick={() => onEditLead(lead)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
