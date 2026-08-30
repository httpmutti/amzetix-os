import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listEmployees, createEmployee } from "@/services/employee.service";
import { z } from "zod";
import type { UserRole, EmploymentType } from "@prisma/client";

const createSchema = z.object({
  userId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  joiningDate: z.string().optional(),
  employmentType: z.string().optional(),
  baseSalary: z.number().optional(),
  currency: z.string().optional(),
  workingHours: z.number().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  emergencyContact: z.object({ name: z.string(), phone: z.string(), relation: z.string() }).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "team:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const result = await listEmployees({
    status: searchParams.get("status") as never ?? undefined,
    departmentId: searchParams.get("departmentId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });

  return NextResponse.json({ data: result.employees, meta: { total: result.total, pages: result.pages, page: result.page } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "team:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { joiningDate, employmentType, ...rest } = parsed.data;

  try {
    const employee = await createEmployee(
      {
        ...rest,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        employmentType: employmentType as EmploymentType | undefined,
      },
      session.user.id
    );
    return NextResponse.json({ data: employee }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
