import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { startTimer } from "@/services/time.service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "time:track")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const emp = await prisma.employee.findFirst({ where: { userId: session.user.id! } });
  if (!emp) return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const entry = await startTimer(emp.id, body.projectId, body.taskId, body.description);

  return NextResponse.json({ data: entry }, { status: 201 });
}
