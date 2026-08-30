import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { addTaskComment } from "@/services/task.service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "tasks:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: taskId } = await params;
  const comments = await prisma.taskComment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ data: comments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "tasks:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: taskId } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const comment = await addTaskComment(taskId, session.user.id!, content.trim());

  return NextResponse.json({ data: comment }, { status: 201 });
}
