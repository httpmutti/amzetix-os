import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listTimeEntries, createManualEntry } from "@/services/time.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const manualSchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as UserRole;
  const { searchParams } = new URL(req.url);

  const emp = await prisma.employee.findFirst({ where: { userId: session.user.id! } });
  const canViewAll = hasPermission(role, "time:view_all");

  const entries = await listTimeEntries({
    employeeId: canViewAll && searchParams.get("employeeId") ? searchParams.get("employeeId")! : emp?.id,
    projectId: searchParams.get("projectId") || undefined,
    taskId: searchParams.get("taskId") || undefined,
    from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    limit: parseInt(searchParams.get("limit") ?? "200"),
  });

  return NextResponse.json({ data: entries });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "time:track")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const emp = await prisma.employee.findFirst({ where: { userId: session.user.id! } });
  if (!emp) return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = manualSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const entry = await createManualEntry({
    employeeId: emp.id,
    ...parsed.data,
    startTime: new Date(parsed.data.startTime),
    endTime: new Date(parsed.data.endTime),
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
