import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import type { UserRole, DocumentType } from "@prisma/client";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "documents:upload")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });

  const documentType = (formData.get("documentType") as DocumentType | null) ?? "OTHER";
  const clientId = (formData.get("clientId") as string | null) || undefined;
  const projectId = (formData.get("projectId") as string | null) || undefined;
  const employeeId = (formData.get("employeeId") as string | null) || undefined;
  const invoiceId = (formData.get("invoiceId") as string | null) || undefined;
  const description = (formData.get("description") as string | null) || undefined;
  const isPrivate = formData.get("isPrivate") === "true";

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { fileUrl } = await uploadFile(buffer, file.name, file.type);

  const doc = await prisma.document.create({
    data: {
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      fileType: file.type || undefined,
      documentType,
      uploadedById: session.user.id,
      clientId,
      projectId,
      employeeId,
      invoiceId,
      description,
      isPrivate,
    },
  });

  await createAuditLog({
    performedById: session.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entity: "Document",
    entityId: doc.id,
    description: `Uploaded document ${file.name}`,
  });

  return NextResponse.json({ data: doc }, { status: 201 });
}
