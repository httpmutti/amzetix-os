import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/services/employee.service";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  joiningDate: z.string().nullable().optional(),
  employmentType: z.string().optional(),
  baseSalary: z.number().optional(),
  currency: z.string().optional(),
  workingHours: z.number().optional(),
  status: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  emergencyContact: z.object({ name: z.string(), phone: z.string(), relation: z.string() }).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "team:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const employee = await getEmployeeById(id);
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: employee });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "team:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { joiningDate, employmentType, status, ...rest } = parsed.data;

  try {
    const employee = await updateEmployee(
      id,
      {
        ...rest,
        joiningDate: joiningDate ? new Date(joiningDate) : joiningDate === null ? null : undefined,
        employmentType: employmentType as never,
        status: status as never,
      },
      session.user.id
    );
    return NextResponse.json({ data: employee });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "team:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deleteEmployee(id, session.user.id);
  return NextResponse.json({ data: null });
}
