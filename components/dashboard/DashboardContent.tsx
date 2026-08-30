"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Users,
  CheckSquare,
  Clock,
  ArrowUpRight,
  UserCheck,
  Calendar,
  AlertCircle,
  ArrowRight,
  PlayCircle,
  FileText,
} from "lucide-react";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboardStore } from "@/lib/store/dashboard.store";
import { formatCurrency, formatHours, formatDate, formatRelative } from "@/lib/utils";

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--card-pad)]"
        >
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-7 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

const INVOICE_STATUS_BADGE: Record<string, string> = {
  DRAFT: "draft",
  SENT: "sent",
  PARTIALLY_PAID: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
};

const TASK_STATUS_BADGE: Record<string, string> = {
  BACKLOG: "draft",
  TODO: "draft",
  IN_PROGRESS: "in-progress",
  IN_REVIEW: "sent",
  CLIENT_REVIEW: "sent",
  COMPLETED: "active",
  BLOCKED: "lost",
};

export function DashboardContent() {
  const { data, status, fetch } = useDashboardStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const loading = status === "idle" || status === "loading";
  const currency = data?.company?.currency || "USD";

  return (
    <div className="space-y-6">
      {/* ── Quick Navigation & Actions ── */}
      <QuickActions />

      {/* ── Main KPI Metrics Grid ── */}
      {loading || !data ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat
            label="Revenue (MTD)"
            value={formatCurrency(data.financial.cashCollected, currency, true)}
            icon={DollarSign}
            trend={
              data.financial.cashCollected > 0
                ? {
                    value: `${data.financial.profitMargin.toFixed(0)}% margin`,
                    positive: data.financial.netProfit >= 0,
                  }
                : undefined
            }
          />
          <Stat
            label="Outstanding"
            value={formatCurrency(data.financial.outstanding, currency, true)}
            icon={ArrowUpRight}
            trend={
              data.financial.overdue > 0
                ? {
                    value: `${formatCurrency(data.financial.overdue, currency, true)} overdue`,
                    positive: false,
                  }
                : undefined
            }
          />
          <Stat
            label="Active Clients"
            value={String(data.clients.active)}
            icon={Users}
            trend={
              data.clients.newClients > 0
                ? { value: `+${data.clients.newClients} new this mo.`, positive: true }
                : undefined
            }
          />
          <Stat
            label="Active Tasks"
            value={String(data.tasks.total)}
            icon={CheckSquare}
            trend={
              data.tasks.overdue > 0
                ? { value: `${data.tasks.overdue} overdue`, positive: false }
                : data.tasks.inProgress > 0
                ? { value: `${data.tasks.inProgress} in progress`, positive: true }
                : undefined
            }
          />
          <Stat
            label="Clocked In Now"
            value={`${data.timeTracking.activeNow} active`}
            icon={Clock}
            trend={{
              value: `${formatHours(data.timeTracking.todayMinutes)} logged today`,
              positive: true,
            }}
          />
          <Stat
            label="Team Attendance"
            value={`${data.team.present}/${data.team.totalEmployees}`}
            icon={UserCheck}
            trend={
              data.team.pendingLeaves > 0
                ? { value: `${data.team.pendingLeaves} leave req. pending`, positive: false }
                : {
                    value: `${data.team.attendancePct}% present today`,
                    positive: data.team.attendancePct >= 80,
                  }
            }
          />
        </div>
      )}

      {/* ── Mid Section: Financial Chart & Live Operations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Chart */}
        <div className="lg:col-span-2">
          {loading || !data ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 bg-[var(--surface-card)]">
              <Skeleton className="h-4 w-52 mb-4" />
              <Skeleton className="h-[260px] w-full" />
            </div>
          ) : (
            <RevenueChart data={data.chart} currency={currency} />
          )}
        </div>

        {/* Live Operations / HR & Time Hub */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 bg-[var(--surface-card)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Live Operations & Staff
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Real-time activity at Amzetix
                </p>
              </div>
              <Link
                href="/time"
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 transition-colors"
              >
                Time Tracker <ArrowRight size={12} />
              </Link>
            </div>

            {loading || !data ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="py-3 space-y-4">
                {/* Active timers snapshot */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 flex items-center justify-between">
                    <span>Active Timers ({data.timeTracking.activeEntries.length})</span>
                    <span className="text-[11px] text-[var(--color-success-600)] font-medium">● Live</span>
                  </p>
                  {data.timeTracking.activeEntries.length === 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)] py-2 bg-[var(--surface-page)] px-3 rounded-md border border-[var(--border-subtle)]">
                      No employees are currently clocked in.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.timeTracking.activeEntries.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between p-2 rounded-md bg-[var(--surface-page)] border border-[var(--border-subtle)] text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-[var(--sidebar-item-active-bg)] border border-[var(--border-default)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)] shrink-0">
                              {e.employee.firstName[0]}{e.employee.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--text-primary)] truncate">
                                {e.employee.firstName} {e.employee.lastName}
                              </p>
                              <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                                {e.description}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-[var(--color-success-600)] shrink-0">
                            {formatRelative(e.startTime).replace(" ago", "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Today's Attendance breakdown */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Today's Attendance</p>
                    <Link
                      href="/attendance"
                      className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      View sheet →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-md bg-[var(--surface-page)] border border-[var(--border-subtle)]">
                      <p className="text-base font-bold text-[var(--text-primary)]">{data.team.present}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Present</p>
                    </div>
                    <div className="p-2 rounded-md bg-[var(--surface-page)] border border-[var(--border-subtle)]">
                      <p className="text-base font-bold text-[var(--color-warning-500)]">{data.team.late}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Late</p>
                    </div>
                    <div className="p-2 rounded-md bg-[var(--surface-page)] border border-[var(--border-subtle)]">
                      <p className="text-base font-bold text-[var(--text-secondary)]">{data.team.onLeave}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">On Leave</p>
                    </div>
                  </div>
                </div>

                {/* Pending Leaves banner if any */}
                {data.team.pendingLeaves > 0 && (
                  <Link
                    href="/leave"
                    className="flex items-center justify-between p-2.5 rounded-md bg-[var(--status-pending-bg)] border border-[var(--color-warning-500)]/30 text-xs transition-colors hover:opacity-90"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[var(--color-warning-600)] shrink-0" />
                      <span className="font-medium text-[var(--status-pending-fg)]">
                        {data.team.pendingLeaves} Pending Leave Request{data.team.pendingLeaves > 1 ? "s" : ""}
                      </span>
                    </div>
                    <ArrowRight size={12} className="text-[var(--status-pending-fg)]" />
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Total Staff: {data?.team.totalEmployees ?? 0}</span>
            <Link href="/team" className="hover:text-[var(--text-primary)] font-medium">
              Team Directory →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Active Tasks, Recent Invoices & Activity Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority / Active Tasks */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 bg-[var(--surface-card)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Work & Tasks</h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Priority and in-progress assignments</p>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 transition-colors"
            >
              Task Board <ArrowRight size={12} />
            </Link>
          </div>

          {loading || !data ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : data.recentTasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 text-center text-xs text-[var(--text-tertiary)]">
              No open tasks currently. All caught up!
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {data.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-md bg-[var(--surface-page)] border border-[var(--border-subtle)] text-xs flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-[var(--text-primary)] line-clamp-1">
                      {task.title}
                    </p>
                    <Badge variant={TASK_STATUS_BADGE[task.status] as never || "default"}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                    <span>{task.assigneeName}</span>
                    {task.dueDate && (
                      <span className={new Date(task.dueDate) < new Date() ? "text-[var(--color-danger-500)] font-semibold" : ""}>
                        Due {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices & Billing */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 bg-[var(--surface-card)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Invoices & Receivables</h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Recent billing and client balances</p>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 transition-colors"
            >
              All Invoices <ArrowRight size={12} />
            </Link>
          </div>

          {loading || !data ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : data.recentInvoices.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 text-center text-xs text-[var(--text-tertiary)]">
              No recent invoices generated.
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {data.recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-md bg-[var(--surface-page)] border border-[var(--border-subtle)] text-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {inv.invoiceNumber}
                      </span>
                      <Badge variant={INVOICE_STATUS_BADGE[inv.status] as never || "default"}>
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                      {inv.clientName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {formatCurrency(inv.total, inv.currency || currency)}
                    </p>
                    {inv.balanceDue > 0 ? (
                      <p className="text-[10px] text-[var(--color-danger-500)] font-medium">
                        Due: {formatCurrency(inv.balanceDue, inv.currency || currency)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-[var(--color-success-600)]">Paid</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Stream */}
        <div>
          {loading || !data ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 bg-[var(--surface-card)]">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    <SkeletonText lines={2} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ActivityFeed
              entries={data.activity.map((e) => ({
                ...e,
                createdAt: new Date(e.createdAt),
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
