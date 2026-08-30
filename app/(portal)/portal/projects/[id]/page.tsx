import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortalCommentForm } from "@/components/portal/PortalCommentForm";
import { CheckSquare, MessageSquare, Paperclip, ArrowLeft } from "lucide-react";
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

const TASK_BADGE: Record<string, BadgeVariant> = {
  TODO:        "draft",
  IN_PROGRESS: "in-progress",
  REVIEW:      "pending",
  DONE:        "success",
  CANCELLED:   "cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planned", ACTIVE: "Active", IN_REVIEW: "In Review",
  CLIENT_REVIEW: "Client Review", ON_HOLD: "On Hold",
  COMPLETED: "Completed", CANCELLED: "Cancelled",
  TODO: "To Do", IN_PROGRESS: "In Progress", REVIEW: "Review", DONE: "Done",
};

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cp = await getPortalClient(session.user.id);
  if (!cp) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id, clientId: cp.clientId, deletedAt: null },
    include: {
      tasks: {
        where: { visibility: "CLIENT_VISIBLE" },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        select: { id: true, taskId: true, title: true, status: true, dueDate: true, description: true },
      },
      comments: {
        where: { visibility: "CLIENT_VISIBLE" },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, image: true } } },
      },
      documents: {
        where: { isPrivate: false, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, fileName: true, fileSize: true, documentType: true, description: true },
      },
    },
  });

  if (!project) notFound();

  const taskGroups: Record<string, typeof project.tasks> = {
    TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [],
  };
  for (const t of project.tasks) {
    const key = t.status in taskGroups ? t.status : "TODO";
    taskGroups[key].push(t);
  }

  const comments = project.comments.map(c => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    user: { name: c.user.name, image: c.user.image },
  }));

  return (
    <div className="space-y-8">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link
          href="/portal/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={15} />
          Back to Projects
        </Link>
        <span style={{ color: "var(--border-default)" }}>/</span>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{project.name}</span>
      </div>

      {/* Header card */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{project.projectId}</span>
              <Badge variant={PROJECT_BADGE[project.status] ?? "default"} dot>
                {STATUS_LABEL[project.status] ?? project.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{project.name}</h1>
            {project.description && (
              <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-secondary)" }}>{project.description}</p>
            )}
          </div>
          <div className="text-right space-y-1 text-sm shrink-0">
            {project.startDate && (
              <p style={{ color: "var(--text-secondary)" }}>
                Start: <span style={{ color: "var(--text-primary)" }}>{formatDate(project.startDate)}</span>
              </p>
            )}
            {project.dueDate && (
              <p style={{ color: "var(--text-secondary)" }}>
                Due: <span style={{ color: "var(--text-primary)" }}>{formatDate(project.dueDate)}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Tasks */}
      {project.tasks.length > 0 && (
        <Card padding="none">
          <CardHeader className="px-5 py-4 border-b mb-0" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-2">
              <CheckSquare size={15} style={{ color: "var(--text-tertiary)" }} />
              <CardTitle>Tasks</CardTitle>
            </div>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{project.tasks.length} total</span>
          </CardHeader>
          <ul>
            {project.tasks.map((t, i) => (
              <li
                key={t.id}
                className={`flex items-center justify-between gap-4 px-5 py-3.5 ${i < project.tasks.length - 1 ? "border-b" : ""}`}
                style={{ borderColor: "var(--border-default)" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                  {t.description && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{t.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {t.dueDate && (
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Due {formatDate(t.dueDate)}</span>
                  )}
                  <Badge variant={TASK_BADGE[t.status] ?? "default"}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Files */}
      {project.documents.length > 0 && (
        <Card padding="none">
          <CardHeader className="px-5 py-4 border-b mb-0" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-2">
              <Paperclip size={15} style={{ color: "var(--text-tertiary)" }} />
              <CardTitle>Files</CardTitle>
            </div>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{project.documents.length} file{project.documents.length !== 1 ? "s" : ""}</span>
          </CardHeader>
          <ul>
            {project.documents.map((doc, i) => (
              <li
                key={doc.id}
                className={i < project.documents.length - 1 ? "border-b" : ""}
                style={{ borderColor: "var(--border-default)" }}
              >
                <a
                  href={`/api/documents/${doc.id}/download`}
                  download={doc.fileName}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--interactive-secondary-hover)]"
                >
                  <span className="text-base">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{doc.fileName}</p>
                    {doc.description && (
                      <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{doc.description}</p>
                    )}
                  </div>
                  {doc.fileSize && (
                    <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Messages */}
      <Card padding="none">
        <CardHeader className="px-5 py-4 border-b mb-0" style={{ borderColor: "var(--border-default)" }}>
          <div className="flex items-center gap-2">
            <MessageSquare size={15} style={{ color: "var(--text-tertiary)" }} />
            <CardTitle>Messages</CardTitle>
          </div>
        </CardHeader>
        <div className="p-5">
          <PortalCommentForm projectId={project.id} initialComments={comments} />
        </div>
      </Card>
    </div>
  );
}
