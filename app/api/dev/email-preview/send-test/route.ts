import { NextRequest, NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email";
import { sendPortalInviteEmail } from "@/lib/email";
import { sendPayslipEmail } from "@/lib/email";
import { sendLeaveRequestEmail } from "@/lib/email";
import { sendLeaveApprovedEmail } from "@/lib/email";
import { sendLeaveRejectedEmail } from "@/lib/email";
import { sendTaskAssignedEmail } from "@/lib/email";
import { sendWelcomeEmployeeEmail } from "@/lib/email";

const TEST_TO = "engineermuttiullah@gmail.com";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { template } = await req.json();
  const companyName = process.env.COMPANY_NAME ?? "AMZETIX";
  const portalUrl   = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/portal`;
  const dashUrl     = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard`;

  try {
    switch (template) {
      case "invoice-sent":
        await sendInvoiceEmail({
          companyName,
          clientName: "Horizon Digital Ltd.",
          invoiceNumber: "INV-2026-0042",
          issueDate: "August 1, 2026",
          dueDate: "August 31, 2026",
          total: "5,250.00",
          currency: "USD",
          portalUrl: `${portalUrl}/invoices/inv-0042`,
          items: [
            { description: "UI/UX Design — Mobile App Redesign", quantity: 1, unitPrice: "2,500.00", total: "2,500.00" },
            { description: "Frontend Development (React)", quantity: 40, unitPrice: "60.00", total: "2,400.00" },
            { description: "Project Management", quantity: 7, unitPrice: "50.00", total: "350.00" },
          ],
        }, TEST_TO);
        break;

      case "portal-invite":
        await sendPortalInviteEmail({
          companyName,
          clientName: "Horizon Digital Ltd.",
          recipientName: "Sarah Mitchell",
          email: "sarah@horizon.digital",
          temporaryPassword: "x7k2mq9r",
          portalUrl,
        }, TEST_TO);
        break;

      case "payslip":
        await sendPayslipEmail({
          companyName,
          employeeName: "Ahmed Al-Rashid",
          employeeId: "EMP-007",
          position: "Senior Frontend Engineer",
          department: "Engineering",
          month: MONTHS[7],
          year: 2026,
          basicSalary: "4,500.00",
          allowances: "300.00",
          bonuses: "500.00",
          overtimePay: "180.00",
          grossPay: "5,480.00",
          taxDeductions: "720.00",
          otherDeductions: "50.00",
          advances: "0.00",
          netPay: "4,710.00",
          currency: "USD",
          paidAt: "August 30, 2026",
        }, TEST_TO);
        break;

      case "leave-request":
        await sendLeaveRequestEmail({
          companyName,
          hrName: "Layla Hassan",
          employeeName: "Ahmed Al-Rashid",
          leaveType: "Annual Leave",
          startDate: "September 10, 2026",
          endDate: "September 14, 2026",
          totalDays: 5,
          reason: "Family vacation — planned in advance. Handoff arranged with the team.",
          requestId: "LVR-2026-0018",
          dashboardUrl: `${dashUrl}/leave`,
        }, TEST_TO);
        break;

      case "leave-approved":
        await sendLeaveApprovedEmail({
          companyName,
          employeeName: "Ahmed Al-Rashid",
          leaveType: "Annual Leave",
          startDate: "September 10, 2026",
          endDate: "September 14, 2026",
          totalDays: 5,
          approvedBy: "Layla Hassan",
          note: "Approved! Please brief the team before you leave. Enjoy your vacation.",
        }, TEST_TO);
        break;

      case "leave-rejected":
        await sendLeaveRejectedEmail({
          companyName,
          employeeName: "Ahmed Al-Rashid",
          leaveType: "Annual Leave",
          startDate: "September 10, 2026",
          endDate: "September 14, 2026",
          totalDays: 5,
          rejectedBy: "Layla Hassan",
          reason: "Major client delivery scheduled during that period. Please resubmit for a different date.",
        }, TEST_TO);
        break;

      case "task-assigned":
        await sendTaskAssignedEmail({
          companyName,
          assigneeName: "Ahmed Al-Rashid",
          assignerName: "Layla Hassan",
          taskTitle: "Redesign the client dashboard onboarding flow",
          taskDescription: "Update the onboarding wizard to match the new design system. Include progress indicators and contextual tooltips.",
          projectName: "Horizon Digital — Phase 2",
          priority: "HIGH",
          dueDate: "September 5, 2026",
          dashboardUrl: `${dashUrl}/tasks`,
        }, TEST_TO);
        break;

      case "welcome-employee":
        await sendWelcomeEmployeeEmail({
          companyName,
          employeeName: "Marcus Okafor",
          position: "Product Designer",
          department: "Design",
          startDate: "September 1, 2026",
          email: "marcus@amzetix.com",
          temporaryPassword: "wlk9zr3p",
          dashboardUrl: dashUrl,
          hrName: "Layla Hassan",
          hrEmail: "hr@amzetix.com",
        }, TEST_TO);
        break;

      default:
        return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, sentTo: TEST_TO, template });
  } catch (err) {
    console.error("[send-test]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Send failed" }, { status: 500 });
  }
}
