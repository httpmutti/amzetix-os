import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTimeEntry, deleteTimeEntry } from "@/services/time.service";
import type { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const entry = await updateTimeEntry(id, {
    description: body.description,
    projectId: body.projectId,
    taskId: body.taskId,
    startTime: body.startTime ? new Date(body.startTime) : undefined,
    endTime: body.endTime ? new Date(body.endTime) : undefined,
  });

  return NextResponse.json({ data: entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "time:track")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deleteTimeEntry(id);

  return NextResponse.json({ success: true });
}
