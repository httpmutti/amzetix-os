import { NextResponse } from "next/server";
import { render } from "@react-email/render";

// Only accessible in development
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ template: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { template } = await params;
  const companyName = process.env.COMPANY_NAME ?? "AMZETIX";
  const portalUrl = "http://localhost:3000/portal";
  const dashboardUrl = "http://localhost:3000/dashboard";

  let html: string;

  switch (template) {
    case "invoice-sent": {
      const { InvoiceSentEmail } = await import("@/emails/invoice-sent");
      html = await render(InvoiceSentEmail({
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
      }));
      break;
    }

    case "portal-invite": {
      const { PortalInviteEmail } = await import("@/emails/portal-invite");
      html = await render(PortalInviteEmail({
        companyName,
        clientName: "Horizon Digital Ltd.",
        recipientName: "Sarah Mitchell",
        email: "sarah@horizon.digital",
        temporaryPassword: "x7k2mq9r",
        portalUrl,
      }));
      break;
    }

    case "payslip": {
      const { PayslipEmail } = await import("@/emails/payslip");
      html = await render(PayslipEmail({
        companyName,
        employeeName: "Ahmed Al-Rashid",
        employeeId: "EMP-007",
        position: "Senior Frontend Engineer",
        department: "Engineering",
        month: "August",
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
      }));
      break;
    }

    case "leave-request": {
      const { LeaveRequestEmail } = await import("@/emails/leave-request");
      html = await render(LeaveRequestEmail({
        companyName,
        hrName: "Layla Hassan",
        employeeName: "Ahmed Al-Rashid",
        leaveType: "Annual Leave",
        startDate: "September 10, 2026",
        endDate: "September 14, 2026",
        totalDays: 5,
        reason: "Family vacation trip — planned well in advance. Work handoff has been arranged with the team.",
        requestId: "LVR-2026-0018",
        dashboardUrl: `${dashboardUrl}/leave`,
      }));
      break;
    }

    case "leave-approved": {
      const { LeaveApprovedEmail } = await import("@/emails/leave-approved");
      html = await render(LeaveApprovedEmail({
        companyName,
        employeeName: "Ahmed Al-Rashid",
        leaveType: "Annual Leave",
        startDate: "September 10, 2026",
        endDate: "September 14, 2026",
        totalDays: 5,
        approvedBy: "Layla Hassan",
        note: "Approved! Please ensure you've briefed the team before you leave. Enjoy your vacation.",
      }));
      break;
    }

    case "leave-rejected": {
      const { LeaveRejectedEmail } = await import("@/emails/leave-rejected");
      html = await render(LeaveRejectedEmail({
        companyName,
        employeeName: "Ahmed Al-Rashid",
        leaveType: "Annual Leave",
        startDate: "September 10, 2026",
        endDate: "September 14, 2026",
        totalDays: 5,
        rejectedBy: "Layla Hassan",
        reason: "We have a major client delivery scheduled during that period and your involvement is critical. Please resubmit for a different date.",
      }));
      break;
    }

    case "task-assigned": {
      const { TaskAssignedEmail } = await import("@/emails/task-assigned");
      html = await render(TaskAssignedEmail({
        companyName,
        assigneeName: "Ahmed Al-Rashid",
        assignerName: "Layla Hassan",
        taskTitle: "Redesign the client dashboard onboarding flow",
        taskDescription: "Update the onboarding wizard to match the new design system. Include progress indicators and contextual tooltips. See Figma file for specs.",
        projectName: "Horizon Digital — Phase 2",
        priority: "HIGH",
        dueDate: "September 5, 2026",
        dashboardUrl: `${dashboardUrl}/tasks`,
      }));
      break;
    }

    case "welcome-employee": {
      const { WelcomeEmployeeEmail } = await import("@/emails/welcome-employee");
      html = await render(WelcomeEmployeeEmail({
        companyName,
        employeeName: "Marcus Okafor",
        position: "Product Designer",
        department: "Design",
        startDate: "September 1, 2026",
        email: "marcus@amzetix.com",
        temporaryPassword: "wlk9zr3p",
        dashboardUrl,
        hrName: "Layla Hassan",
        hrEmail: "hr@amzetix.com",
      }));
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
