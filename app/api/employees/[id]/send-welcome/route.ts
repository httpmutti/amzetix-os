import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmployeeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "team:edit"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id, deletedAt: null },
    include: {
      user: { select: { email: true, name: true } },
      department: { select: { name: true } },
    },
  });

  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  if (!employee.user?.email) return NextResponse.json({ error: "Employee has no email address" }, { status: 400 });

  // Generate a fresh temporary password and update it
  const tempPassword = Math.random().toString(36).slice(-10);
  const hashed = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({
    where: { id: employee.userId },
    data: { password: hashed },
  });

  const companyName = process.env.COMPANY_NAME ?? "Amzetix -OS";
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? ""}/dashboard`;

  const startDate = employee.joiningDate
    ? employee.joiningDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  try {
    await sendWelcomeEmployeeEmail(
      {
        companyName,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        position: employee.position ?? "Employee",
        department: employee.department?.name ?? undefined,
        startDate,
        email: employee.user.email,
        temporaryPassword: tempPassword,
        dashboardUrl,
        hrName: session.user.name ?? undefined,
        hrEmail: session.user.email ?? undefined,
      },
      employee.user.email,
    );
    return NextResponse.json({ data: { sent: true, email: employee.user.email } });
  } catch (err) {
    console.error("[email] welcome email failed:", err);
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 });
  }
}
