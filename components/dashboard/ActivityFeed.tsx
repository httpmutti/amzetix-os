import { formatRelative } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ENTITY_COLORS: Record<string, { bg: string; fg: string }> = {
  Invoice: { bg: "var(--status-sent-bg)", fg: "var(--status-sent-fg)" },
  Payment: { bg: "var(--status-paid-bg)", fg: "var(--status-paid-fg)" },
  Client: { bg: "var(--status-active-bg)", fg: "var(--status-active-fg)" },
  Project: { bg: "var(--status-in-progress-bg)", fg: "var(--status-in-progress-fg)" },
  Task: { bg: "var(--color-info-50)", fg: "var(--color-info-600)" },
  Employee: { bg: "var(--status-active-bg)", fg: "var(--status-active-fg)" },
  Attendance: { bg: "var(--status-active-bg)", fg: "var(--status-active-fg)" },
  Leave: { bg: "var(--status-pending-bg)", fg: "var(--status-pending-fg)" },
  Expense: { bg: "var(--status-draft-bg)", fg: "var(--status-draft-fg)" },
  User: { bg: "var(--sidebar-item-active-bg)", fg: "var(--text-secondary)" },
};

const ACTION_ICONS: Record<string, string> = {
  CREATE: "+",
  UPDATE: "✎",
  DELETE: "✕",
  SEND: "→",
  PAYMENT_RECORDED: "$",
  STATUS_CHANGE: "↻",
  LOGIN: "→",
  APPROVE: "✓",
  REJECT: "✕",
};

interface ActivityEntry {
  id: string;
  action: string;
  entity: string;
  description: string;
  createdAt: Date;
  performedBy: { name: string | null; image: string | null } | null;
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

export function ActivityFeed({ entries }: ActivityFeedProps) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 bg-[var(--surface-card)] h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent System Activity</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Audit log of team and business events</p>
        </div>
        <Link
          href="/audit-logs"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="text-sm text-[var(--text-tertiary)] text-center">No recent activity recorded.</p>
        </div>
      ) : (
        <ol className="space-y-3 flex-1 overflow-y-auto">
          {entries.map((entry) => {
            const conf = ENTITY_COLORS[entry.entity] ?? {
              bg: "var(--sidebar-item-active-bg)",
              fg: "var(--text-secondary)",
            };
            const icon = ACTION_ICONS[entry.action] ?? "•";
            return (
              <li key={entry.id} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: conf.bg, color: conf.fg }}
                >
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">
                    {entry.description}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                    {entry.performedBy?.name ?? "System"} · {formatRelative(entry.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
