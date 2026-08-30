import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listLeaveTypes, createLeaveType } from "@/services/leave.service";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  daysAllowed: z.number().int().min(0),
  isPaid: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const types = await listLeaveTypes();
  return NextResponse.json({ data: types });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "leave:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const type = await createLeaveType(parsed.data);
  return NextResponse.json({ data: type }, { status: 201 });
}
