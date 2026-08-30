import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FolderOpen } from "lucide-react";
import Link from "next/link";
import type { BadgeVariant } from "@/components/ui/badge";

const PROJECT_BADGE: Record<string, BadgeVariant> = {
  PLANNED:       "draft",
  ACTIVE:        "active",
  IN_REVIEW:     "pending",
  CLIENT_REVIEW: "pending",
  ON_HOLD:       "on-hold",
  COMPLETED:     "success",
  CANCELLED:     "cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED:       "Planned",
  ACTIVE:        "Active",
  IN_REVIEW:     "In Review",
  CLIENT_REVIEW: "Client Review",
  ON_HOLD:       "On Hold",
  COMPLETED:     "Completed",
  CANCELLED:     "Cancelled",
};

export default async function PortalProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cp = await getPortalClient(session.user.id);
  if (!cp) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { clientId: cp.clientId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      projectId: true,
      name: true,
      status: true,
      dueDate: true,
      startDate: true,
      description: true,
      _count: {
        select: { tasks: { where: { visibility: "CLIENT_VISIBLE" } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Projects</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {projects.length} project{projects.length !== 1 ? "s" : ""} total
        </p>
      </div>

      <Card padding="none">
        {projects.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No projects yet" description="Your projects will appear here once they're created." />
        ) : (
          <ul>
            {projects.map((p, i) => (
              <li
                key={p.id}
                className={i < projects.length - 1 ? "border-b" : ""}
                style={{ borderColor: "var(--border-default)" }}
              >
                <Link
                  href={`/portal/projects/${p.id}`}
                  className="flex items-center justify-between gap-6 px-5 py-4 transition-colors hover:bg-[var(--interactive-secondary-hover)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{p.projectId}</span>
                      <Badge variant={PROJECT_BADGE[p.status] ?? "default"} dot>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                    {p.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{p.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    {p.dueDate && (
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Due {formatDate(p.dueDate)}</p>
                    )}
                    {p._count.tasks > 0 && (
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {p._count.tasks} task{p._count.tasks !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
