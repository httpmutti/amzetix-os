import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { removeProjectMember } from "@/services/project.service";
import type { UserRole } from "@prisma/client";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "projects:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId, memberId } = await params;
  await removeProjectMember(projectId, memberId);

  return NextResponse.json({ success: true });
}
