import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { addChecklist, toggleChecklist } from "@/services/task.service";
import type { UserRole } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "tasks:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: taskId } = await params;
  const { label, sortOrder } = await req.json();
  if (!label?.trim()) return NextResponse.json({ error: "Label required" }, { status: 400 });

  const item = await addChecklist(taskId, label.trim(), sortOrder);
  return NextResponse.json({ data: item }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: checklistId, done } = await req.json();
  if (!checklistId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await toggleChecklist(checklistId, Boolean(done));
  return NextResponse.json({ data: item });
}
