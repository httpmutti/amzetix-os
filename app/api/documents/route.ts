import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import type { UserRole, DocumentType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "documents:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "all";           // all | client | project | employee | invoice
  const documentType = searchParams.get("type") as DocumentType | null;
  const clientId = searchParams.get("clientId") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const invoiceId = searchParams.get("invoiceId") ?? undefined;

  const where: Record<string, unknown> = { deletedAt: null };
  if (documentType) where.documentType = documentType;
  if (tab === "client") where.clientId = clientId ? clientId : { not: null };
  else if (tab === "project") where.projectId = projectId ? projectId : { not: null };
  else if (tab === "employee") where.employeeId = employeeId ? employeeId : { not: null };
  else if (tab === "invoice") where.invoiceId = invoiceId ? invoiceId : { not: null };
  if (clientId && tab !== "client") where.clientId = clientId;
  if (projectId && tab !== "project") where.projectId = projectId;
  if (employeeId && tab !== "employee") where.employeeId = employeeId;
  if (invoiceId && tab !== "invoice") where.invoiceId = invoiceId;

  const docs = await prisma.document.findMany({
    where,
    include: {
      client: { select: { companyName: true } },
      project: { select: { name: true } },
      employee: { select: { firstName: true, lastName: true } },
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: docs });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "documents:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.SOFT_DELETE,
    entity: "Document",
    entityId: id,
    description: `Deleted document ${doc.fileName}`,
  });

  return NextResponse.json({ data: { success: true } });
}
