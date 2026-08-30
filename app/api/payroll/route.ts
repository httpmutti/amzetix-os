import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listPayrollRuns, createPayrollRun } from "@/services/payroll.service";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const createSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export async function GET(req: Request) {
  void req;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:view_all")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const runs = await listPayrollRuns();
  return NextResponse.json({ data: runs });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { month, year } = parsed.data;

  try {
    const payroll = await createPayrollRun(month, year, session.user.id);
    await createAuditLog({
      performedById: session.user.id,
      action: AUDIT_ACTIONS.CREATE,
      entity: "Payroll",
      entityId: payroll?.id,
      description: `Created payroll run for ${month}/${year}`,
    });
    return NextResponse.json({ data: payroll }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create payroll";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
