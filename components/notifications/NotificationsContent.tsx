"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, CheckCheck, ExternalLink, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/pagination";
import { formatDistanceToNow } from "date-fns";
import { useNotificationsStore } from "@/lib/store/notifications.store";
import type { AppNotification } from "@/lib/store/notifications.store";

const TYPE_ICON: Record<string, string> = {
  TASK_ASSIGNED: "📋", TASK_DUE_SOON: "⏰", TASK_OVERDUE: "🔴",
  PROJECT_DEADLINE: "📅", INVOICE_CREATED: "🧾", INVOICE_DUE: "💳",
  INVOICE_OVERDUE: "❗", PAYMENT_RECEIVED: "💰", LEAVE_REQUEST: "🏖️",
  LEAVE_APPROVED: "✅", LEAVE_REJECTED: "❌", ATTENDANCE_ISSUE: "⚠️",
  PAYROLL_APPROVED: "💵", CLIENT_COMMENT: "💬", DOCUMENT_UPLOADED: "📎", GENERAL: "🔔",
};

const PAGE_SIZE = 20;

export function NotificationsContent() {
  const router = useRouter();
  const { data, status, fetch, mutate } = useNotificationsStore();
  const [page, setPage] = useState(1);

  useEffect(() => { fetch(); }, [fetch]);

  const loading = status === "idle" || status === "loading";
  const all = data ?? [];
  const unreadCount = all.filter((n) => !n.isRead).length;

  const paginated = useMemo(() => {
    const total = all.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return { items, total, totalPages };
  }, [all, page]);

  async function markAllRead() {
    await window.fetch("/api/notifications/mark-all-read", { method: "POST" });
    mutate((list) => list.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  }

  async function markRead(id: string) {
    await window.fetch(`/api/notifications/${id}`, { method: "PATCH" });
    mutate((list) => list.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  function handleClick(n: AppNotification) {
    if (!n.isRead) markRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {all.length} notification{all.length !== 1 ? "s" : ""}
          {unreadCount > 0 && (
            <span className="ml-2 font-semibold" style={{ color: "var(--interactive-primary)" }}>
              · {unreadCount} unread
            </span>
          )}
        </p>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <Card padding="none">
        {loading ? (
          <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4 animate-pulse">
                <div className="h-9 w-9 rounded-full shrink-0" style={{ background: "var(--surface-page)" }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 rounded w-1/3" style={{ background: "var(--surface-page)" }} />
                  <div className="h-3 rounded w-2/3" style={{ background: "var(--surface-page)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.items.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={Bell as LucideIcon} title="No notifications" description="You're all caught up." />
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border-default)" }}>
            {paginated.items.map(n => (
              <li key={n.id}>
                <div
                  role={n.link ? "button" : undefined}
                  tabIndex={n.link ? 0 : undefined}
                  onClick={() => handleClick(n)}
                  onKeyDown={e => e.key === "Enter" && handleClick(n)}
                  className="flex gap-4 px-5 py-4 transition-colors"
                  style={{ background: n.isRead ? "transparent" : "var(--interactive-primary-bg)", cursor: n.link ? "pointer" : "default" }}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center text-base" style={{ background: "var(--surface-page)", border: "1px solid var(--border-default)" }}>
                      {TYPE_ICON[n.type] ?? "🔔"}
                    </div>
                    {!n.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2" style={{ background: "var(--interactive-primary)", borderColor: "var(--surface-card)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                        {n.link && <ExternalLink size={13} style={{ color: "var(--text-tertiary)" }} />}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {paginated.totalPages > 1 && (
        <Pagination page={page} totalPages={paginated.totalPages} total={paginated.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      )}
    </div>
  );
}
