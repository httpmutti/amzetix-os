import { NextResponse } from "next/server";
import { generateInvoicePDF, generatePayslipPDF } from "@/lib/pdf";

// Force Node.js runtime — @react-pdf/renderer requires it
export const runtime = "nodejs";

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

  try {
    let buffer: Buffer;
    let filename: string;

    switch (template) {
      case "invoice-sent": {
        buffer = await generateInvoicePDF({
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
        });
        filename = "Invoice-INV-2026-0042.pdf";
        break;
      }

      case "payslip": {
        buffer = await generatePayslipPDF({
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
        });
        filename = "Payslip-August-2026-Ahmed-Al-Rashid.pdf";
        break;
      }

      default:
        return NextResponse.json({ error: "No PDF for this template" }, { status: 404 });
    }

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("[pdf-preview]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
