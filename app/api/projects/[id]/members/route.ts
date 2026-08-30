import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { addProjectMember } from "@/services/project.service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "projects:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, position: true, profileImage: true } },
    },
  });

  return NextResponse.json({ data: members });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "projects:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const { employeeId, role } = await req.json();
  if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 });

  try {
    const member = await addProjectMember(projectId, employeeId, role);
    return NextResponse.json({ data: member }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }
}
