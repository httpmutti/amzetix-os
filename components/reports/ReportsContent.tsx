"use client";

import { useState } from "react";
import {
  BarChart2, Receipt, Users, Clock, TrendingUp, Activity,
  Download, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2].map(y => ({ value: String(y), label: String(y) }));

type ReportType = "revenue" | "expense" | "payroll" | "attendance" | "project-profitability" | "client-activity";

interface ReportMeta {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
  financial: boolean;
}

const REPORTS: ReportMeta[] = [
  { type: "revenue", label: "Revenue Report", description: "Paid invoices grouped by client and month", icon: TrendingUp, financial: true },
  { type: "expense", label: "Expense Report", description: "All expenses by category and date range", icon: Receipt, financial: true },
  { type: "payroll", label: "Payroll Report", description: "Monthly payroll totals, year to date", icon: Users, financial: true },
  { type: "attendance", label: "Attendance Report", description: "Employee present / absent / leave counts", icon: Clock, financial: false },
  { type: "project-profitability", label: "Project Profitability", description: "Revenue vs hours logged vs expenses per project", icon: BarChart2, financial: true },
  { type: "client-activity", label: "Client Activity", description: "Last project, last invoice, outstanding balance per client", icon: Activity, financial: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = { rows: any[]; summary: any };

function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => {
      const v = String(r[h] ?? "").replace(/"/g, '""');
      return v.includes(",") || v.includes('"') ? `"${v}"` : v;
    }).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

interface ReportCardProps {
  meta: ReportMeta;
  canExport: boolean;
  year: string;
}

function ReportCard({ meta, canExport, year }: ReportCardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const Icon = meta.icon;

  const generate = async () => {
    if (data && open) { setOpen(false); return; }
    setLoading(true);
    setOpen(true);
    const res = await window.fetch(`/api/reports/${meta.type}?year=${year}`);
    const json = await res.json();
    if (res.ok) setData(json.data);
    else { toast.error(json.error ?? "Failed to generate report"); setOpen(false); }
    setLoading(false);
  };

  const handleExport = () => {
    if (!data?.rows?.length) return;
    exportCsv(data.rows, `${meta.type}-${year}.csv`);
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
      {/* Card header */}
      <button
        type="button"
        onClick={generate}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--interactive-secondary-hover)] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--interactive-secondary)]">
            <Icon size={16} className="text-[var(--interactive-primary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{meta.label}</p>
            <p className="text-xs text-[var(--text-secondary)]">{meta.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {meta.financial && <Badge variant="draft">Financial</Badge>}
          {loading ? <RefreshCw size={14} className="animate-spin text-[var(--text-tertiary)]" /> : open ? <ChevronUp size={14} className="text-[var(--text-tertiary)]" /> : <ChevronDown size={14} className="text-[var(--text-tertiary)]" />}
        </div>
      </button>

      {/* Table preview */}
      {open && (
        <div className="border-t border-[var(--border-default)]">
          {loading ? (
            <div className="p-4 flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : data && data.rows.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-raised)]">
                      {Object.keys(data.rows[0]).map(h => (
                        <th key={h} className="px-4 py-2 text-left font-medium text-[var(--text-secondary)] whitespace-nowrap capitalize">
                          {h.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-4 py-2 text-[var(--text-secondary)] whitespace-nowrap">
                            {typeof v === "number"
                              ? v > 1000 ? formatCurrency(v, "USD") : String(v)
                              : String(v ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.rows.length > 50 && (
                <p className="px-4 py-2 text-xs text-[var(--text-tertiary)]">Showing 50 of {data.rows.length} rows. Export CSV to see all.</p>
              )}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-default)]">
                <SummaryLine summary={data.summary} type={meta.type} />
                {canExport && (
                  <Button size="sm" variant="outline" onClick={handleExport}>
                    <Download size={13} /> Export CSV
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="px-5 py-4 text-sm text-[var(--text-secondary)]">No data for this period.</p>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryLine({ summary, type }: { summary: Record<string, unknown>; type: ReportType }) {
  if (!summary) return null;
  switch (type) {
    case "revenue": return <p className="text-xs text-[var(--text-secondary)]">{summary.count as number} invoices · Total: <strong className="text-[var(--color-success-600)]">{formatCurrency(summary.total as number, "USD")}</strong></p>;
    case "expense": return <p className="text-xs text-[var(--text-secondary)]">{summary.count as number} expenses · Total: <strong className="text-[var(--color-danger-500)]">{formatCurrency(summary.total as number, "USD")}</strong></p>;
    case "payroll": return <p className="text-xs text-[var(--text-secondary)]">YTD Gross: <strong>{formatCurrency(summary.ytdGross as number, "USD")}</strong> · Net: <strong>{formatCurrency(summary.ytdNet as number, "USD")}</strong></p>;
    case "attendance": return <p className="text-xs text-[var(--text-secondary)]">{summary.employees as number} active employees</p>;
    case "project-profitability": return <p className="text-xs text-[var(--text-secondary)]">{summary.projects as number} projects</p>;
    case "client-activity": return <p className="text-xs text-[var(--text-secondary)]">{summary.clients as number} clients · Outstanding: <strong className="text-[var(--color-warning-600)]">{formatCurrency(summary.totalOutstanding as number, "USD")}</strong></p>;
  }
}

interface Props { canExport: boolean }

export function ReportsContent({ canExport }: Props) {
  const [year, setYear] = useState(String(currentYear));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">Click a report to generate and preview. Export CSV to download all rows.</p>
        <div className="w-28">
          <Select value={year} onValueChange={setYear} options={YEAR_OPTIONS} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {REPORTS.map(meta => (
          <ReportCard key={meta.type} meta={meta} canExport={canExport} year={year} />
        ))}
      </div>
    </div>
  );
}
