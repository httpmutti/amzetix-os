import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listLeaveRequests, createLeaveRequest } from "@/services/leave.service";
import { prisma } from "@/lib/prisma";
import { createNotificationForMany } from "@/lib/notifications";
import { sendLeaveRequestEmail } from "@/lib/email";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const createSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
  employeeId: z.string().optional(), // HR/ADMIN can create on behalf
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "leave:view_own")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const canViewAll = hasPermission(session.user.role as UserRole, "leave:view_all");

  let employeeId = searchParams.get("employeeId") ?? undefined;
  if (!canViewAll) {
    const emp = await prisma.employee.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    employeeId = emp?.id;
  }

  const result = await listLeaveRequests({
    employeeId,
    status: searchParams.get("status") ?? undefined,
    leaveTypeId: searchParams.get("leaveTypeId") ?? undefined,
    year: searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear(),
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });

  return NextResponse.json({ data: result.requests, meta: { total: result.total, pages: result.pages } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "leave:request")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let employeeId = parsed.data.employeeId;
  if (!employeeId) {
    const emp = await prisma.employee.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!emp) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    employeeId = emp.id;
  }

  try {
    const request = await createLeaveRequest({
      employeeId,
      leaveTypeId: parsed.data.leaveTypeId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason,
    });

    // Notify HR/ADMIN users
    const hrUsers = await prisma.user.findMany({
      where: { role: { in: ["OWNER", "ADMIN", "HR"] }, isActive: true },
      select: { id: true, email: true, name: true },
    });
    const emp = request.employee as { firstName: string; lastName: string };
    if (hrUsers.length > 0) {
      await createNotificationForMany(
        hrUsers.map(u => u.id),
        {
          type: "LEAVE_REQUEST",
          title: "New leave request",
          message: `${emp.firstName} ${emp.lastName} has submitted a leave request (${request.days} day${request.days !== 1 ? "s" : ""}).`,
          link: `/leave`,
        }
      );

      // Email HR/ADMIN about the leave request
      const hrEmails = hrUsers.map(u => u.email).filter(Boolean) as string[];
      if (hrEmails.length > 0) {
        const leaveType = (request as { leaveType?: { name: string } }).leaveType?.name ?? "Leave";
        const fmt = (d: Date) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        const hrRecipient = hrUsers[0].name ?? "HR Team";
        sendLeaveRequestEmail(
          {
            companyName: process.env.COMPANY_NAME ?? "Amzetix -OS",
            hrName: hrRecipient,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            leaveType,
            startDate: fmt(request.startDate as unknown as Date),
            endDate: fmt(request.endDate as unknown as Date),
            totalDays: request.days,
            reason: (request as { reason?: string }).reason ?? undefined,
            requestId: request.id,
            dashboardUrl: `${process.env.NEXTAUTH_URL ?? ""}/leave`,
          },
          hrEmails,
        ).catch((err) => console.error("[email] leave request email failed:", err));
      }
    }

    return NextResponse.json({ data: request }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
