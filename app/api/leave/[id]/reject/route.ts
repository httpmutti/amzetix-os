import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { rejectLeaveRequest } from "@/services/leave.service";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendLeaveRejectedEmail } from "@/lib/email";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const schema = z.object({ note: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "leave:approve")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { note } = schema.parse(body);

  try {
    const request = await rejectLeaveRequest(id, session.user.id, note);

    // Notify the employee
    const empUser = await prisma.employee.findUnique({
      where: { id: request.employeeId },
      select: { userId: true, user: { select: { email: true } } },
    });
    if (empUser?.userId) {
      await createNotification({
        userId: empUser.userId,
        type: "LEAVE_REJECTED",
        title: "Leave request rejected",
        message: `Your leave request has been rejected.${note ? ` Note: ${note}` : ""}`,
        link: `/leave`,
      });
    }

    // Send rejection email to employee
    if (empUser?.user?.email) {
      const emp = request.employee as { firstName: string; lastName: string };
      const leaveType = (request as { leaveType?: { name: string } }).leaveType?.name ?? "Leave";
      const reviewerName = session.user.name ?? session.user.email ?? "HR";
      const fmt = (d: Date) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      sendLeaveRejectedEmail(
        {
          companyName: process.env.COMPANY_NAME ?? "Amzetix -OS",
          employeeName: `${emp.firstName} ${emp.lastName}`,
          leaveType,
          startDate: fmt(request.startDate as unknown as Date),
          endDate: fmt(request.endDate as unknown as Date),
          totalDays: request.days,
          rejectedBy: reviewerName,
          reason: note,
        },
        empUser.user.email,
      ).catch((err) => console.error("[email] leave reject email failed:", err));
    }

    return NextResponse.json({ data: request });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
