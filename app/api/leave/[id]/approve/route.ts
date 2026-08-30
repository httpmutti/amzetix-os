import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { approveLeaveRequest } from "@/services/leave.service";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendLeaveApprovedEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "leave:approve")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const request = await approveLeaveRequest(id, session.user.id);

    // Notify the employee
    const emp = request.employee as { userId?: string; firstName: string; lastName: string };
    const empUser = await prisma.employee.findUnique({
      where: { id: request.employeeId },
      select: { userId: true, user: { select: { email: true } } },
    });
    if (empUser?.userId) {
      await createNotification({
        userId: empUser.userId,
        type: "LEAVE_APPROVED",
        title: "Leave request approved",
        message: `Your leave request (${request.days} day${request.days !== 1 ? "s" : ""}) has been approved.`,
        link: `/leave`,
      });
    }

    // Send approval email to employee
    if (empUser?.user?.email) {
      const emp = request.employee as { firstName: string; lastName: string };
      const leaveType = (request as { leaveType?: { name: string } }).leaveType?.name ?? "Leave";
      const approverName = session.user.name ?? session.user.email ?? "HR";
      const fmt = (d: Date) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      sendLeaveApprovedEmail(
        {
          companyName: process.env.COMPANY_NAME ?? "Amzetix -OS",
          employeeName: `${emp.firstName} ${emp.lastName}`,
          leaveType,
          startDate: fmt(request.startDate as unknown as Date),
          endDate: fmt(request.endDate as unknown as Date),
          totalDays: request.days,
          approvedBy: approverName,
        },
        empUser.user.email,
      ).catch((err) => console.error("[email] leave approve email failed:", err));
    }

    return NextResponse.json({ data: request });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
