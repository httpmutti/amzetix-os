import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getAllActiveEntries, getWeeklyHours, getMonthlyHours, adminStartTimer, adminStopTimer } from "@/services/time.service";
import type { UserRole } from "@prisma/client";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "team:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "active";

  if (view === "weekly") {
    const data = await getWeeklyHours();
    return NextResponse.json(data);
  }

  if (view === "monthly") {
    const data = await getMonthlyHours();
    return NextResponse.json(data);
  }

  const active = await getAllActiveEntries();
  return NextResponse.json({ data: active });
}

const startSchema = z.object({
  employeeId: z.string().min(1),
  startTime: z.string().min(1),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  description: z.string().optional(),
});

const stopSchema = z.object({
  employeeId: z.string().min(1),
  endTime: z.string().optional(), // ISO datetime for manual stop time
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "team:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "start";

  const body = await req.json();

  if (action === "stop") {
    const parsed = stopSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const endTime = parsed.data.endTime ? new Date(parsed.data.endTime) : undefined;
    const entry = await adminStopTimer(parsed.data.employeeId, endTime);
    return NextResponse.json({ data: entry });
  }

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { employeeId, startTime, ...opts } = parsed.data;
  const entry = await adminStartTimer(employeeId, new Date(startTime), opts);
  return NextResponse.json({ data: entry }, { status: 201 });
}
