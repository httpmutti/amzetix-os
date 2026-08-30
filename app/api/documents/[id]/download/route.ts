import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getFileBuffer, getDownloadUrl } from "@/lib/storage";
import type { UserRole } from "@prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "documents:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id, deletedAt: null } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If S3, we can either redirect to pre-signed URL or stream buffer
  try {
    if (doc.fileUrl.startsWith("s3://")) {
      const signedUrl = await getDownloadUrl(doc.fileUrl, doc.fileName);
      return NextResponse.redirect(signedUrl);
    }

    const buffer = await getFileBuffer(doc.fileUrl);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.fileType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("[download]", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
