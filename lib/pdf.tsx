import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from "@react-pdf/renderer";
import * as React from "react";
import type { InvoiceSentEmailProps } from "@/emails/invoice-sent";
import type { PayslipEmailProps } from "@/emails/payslip";

// ─── Design tokens (mirrors email layout) ─────────────────────────────────────
const c = {
  headerBg:     "#0a0a0a",
  headerText:   "#ffffff",
  pageBg:       "#f7f7f8",
  cardBg:       "#ffffff",
  primary:      "#0a0a0a",
  secondary:    "#52525b",
  muted:        "#a1a1aa",
  border:       "#e4e4e7",
  tableHeadBg:  "#f4f4f5",
  calloutBg:    "#f4f4f5",
  calloutBorder:"#d4d4d8",
};

const LOGO_DARK = "https://res.cloudinary.com/dxbqlflap/image/upload/v1788032834/mailenium-ai/696581f90aba04b27318a2f2/logos/c2nvizmufckmvflt6mhv.png";

// ─── Shared styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: c.pageBg,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: c.primary,
  },
  header: {
    backgroundColor: c.headerBg,
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogo: {
    height: 32,
    objectFit: "contain",
  },
  headerLabel: {
    color: c.muted,
    fontSize: 8,
    fontFamily: "Helvetica",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  body: {
    backgroundColor: c.cardBg,
    paddingHorizontal: 32,
    paddingVertical: 28,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: c.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  lead: {
    fontSize: 10,
    color: c.secondary,
    marginBottom: 20,
    lineHeight: 1.5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: c.muted,
    fontFamily: "Helvetica",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    color: c.primary,
    fontFamily: "Helvetica-Bold",
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  tableHead: {
    backgroundColor: c.tableHeadBg,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  tableHeadCell: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 8,
    color: c.muted,
    fontFamily: "Helvetica",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 10,
    color: c.primary,
  },
  tableCellRight: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 10,
    color: c.primary,
    textAlign: "right",
  },
  tableCellRightBold: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 10,
    color: c.primary,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  tableCellSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 10,
    color: c.secondary,
  },
  // Callout / total box
  callout: {
    backgroundColor: c.calloutBg,
    borderWidth: 1,
    borderColor: c.calloutBorder,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 16,
  },
  calloutLabel: {
    fontSize: 8,
    color: c.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  calloutAmount: {
    fontSize: 26,
    color: c.primary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
  },
  calloutSub: {
    fontSize: 9,
    color: c.muted,
    marginTop: 4,
  },
  // Footer
  footer: {
    backgroundColor: c.cardBg,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  footerText: {
    fontSize: 9,
    color: c.muted,
    lineHeight: 1.5,
  },
});

// ─── Invoice PDF ──────────────────────────────────────────────────────────────
function InvoicePDF({
  companyName,
  clientName,
  invoiceNumber,
  issueDate,
  dueDate,
  total,
  currency,
  paymentLink,
  items = [],
}: InvoiceSentEmailProps) {
  return (
    <Document title={`Invoice ${invoiceNumber}`} author={companyName}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Image src={LOGO_DARK} style={s.headerLogo} />
          <Text style={s.headerLabel}>Invoice</Text>
        </View>

        {/* Body */}
        <View style={s.body}>
          <Text style={s.sectionTitle}>Invoice {invoiceNumber}</Text>
          <Text style={s.lead}>Issued to {clientName}</Text>

          {/* Meta grid */}
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Invoice Number</Text>
              <Text style={[s.value, { fontFamily: "Courier" }]}>{invoiceNumber}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Issued</Text>
              <Text style={s.value}>{issueDate}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Due Date</Text>
              <Text style={s.value}>{dueDate}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Currency</Text>
              <Text style={s.value}>{currency}</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Line items */}
          {items.length > 0 && (
            <View style={s.table}>
              <View style={s.tableHead}>
                <Text style={[s.tableHeadCell, { flex: 3 }]}>Description</Text>
                <Text style={[s.tableHeadCell, { flex: 0.7, textAlign: "right" }]}>Qty</Text>
                <Text style={[s.tableHeadCell, { flex: 1.2, textAlign: "right" }]}>Unit Price</Text>
                <Text style={[s.tableHeadCell, { flex: 1.2, textAlign: "right" }]}>Total</Text>
              </View>
              {items.map((item, i) => (
                <View key={i} style={i < items.length - 1 ? s.tableRow : s.tableRowLast}>
                  <Text style={[s.tableCell, { flex: 3 }]}>{item.description}</Text>
                  <Text style={[s.tableCellRight, { flex: 0.7 }]}>{item.quantity}</Text>
                  <Text style={[s.tableCellRight, { flex: 1.2 }]}>{currency} {item.unitPrice}</Text>
                  <Text style={[s.tableCellRightBold, { flex: 1.2 }]}>{currency} {item.total}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Total callout */}
          <View style={s.callout}>
            <Text style={s.calloutLabel}>Total Amount Due</Text>
            <Text style={s.calloutAmount}>{currency} {total}</Text>
            <Text style={s.calloutSub}>Payment due by {dueDate}</Text>
            {paymentLink && (
              <Text style={{ fontSize: 9, color: "#6366f1", marginTop: 6 }}>
                Pay online: {paymentLink}
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {companyName} · This invoice was generated automatically. Please keep this document for your records.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Payslip PDF ──────────────────────────────────────────────────────────────
function PayslipPDF({
  companyName,
  employeeName,
  employeeId,
  position,
  department,
  month,
  year,
  basicSalary,
  allowances,
  bonuses,
  overtimePay,
  grossPay,
  taxDeductions,
  otherDeductions,
  advances,
  netPay,
  currency,
  paidAt,
}: PayslipEmailProps) {
  const earningsRows = [
    { label: "Basic Salary", value: `${currency} ${basicSalary}` },
    { label: "Allowances",   value: `${currency} ${allowances}` },
    { label: "Bonuses",      value: `${currency} ${bonuses}` },
    { label: "Overtime Pay", value: `${currency} ${overtimePay}` },
  ];
  const deductionRows = [
    { label: "Tax Deductions",   value: `${currency} ${taxDeductions}` },
    { label: "Other Deductions", value: `${currency} ${otherDeductions}` },
    { label: "Advances",         value: `${currency} ${advances}` },
  ];

  return (
    <Document title={`Payslip — ${month} ${year}`} author={companyName}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Image src={LOGO_DARK} style={s.headerLogo} />
          <Text style={s.headerLabel}>Payslip</Text>
        </View>

        {/* Body */}
        <View style={s.body}>
          <Text style={s.sectionTitle}>Payslip — {month} {year}</Text>
          <Text style={s.lead}>Pay statement for {employeeName}</Text>

          {/* Employee info */}
          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>Employee</Text>
              <Text style={s.value}>{employeeName}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.label}>Employee ID</Text>
              <Text style={[s.value, { fontFamily: "Courier" }]}>{employeeId}</Text>
            </View>
            {position && (
              <View style={s.col}>
                <Text style={s.label}>Position</Text>
                <Text style={s.value}>{position}</Text>
              </View>
            )}
            {department && (
              <View style={s.col}>
                <Text style={s.label}>Department</Text>
                <Text style={s.value}>{department}</Text>
              </View>
            )}
          </View>

          <View style={s.divider} />

          {/* Earnings */}
          <Text style={[s.label, { marginBottom: 6 }]}>Earnings</Text>
          <View style={[s.table, { marginBottom: 16 }]}>
            {earningsRows.map((row, i) => (
              <View key={row.label} style={i < earningsRows.length - 1 ? s.tableRow : s.tableRowLast}>
                <Text style={[s.tableCellSecondary, { flex: 1 }]}>{row.label}</Text>
                <Text style={[s.tableCellRight, { flex: 0.5 }]}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Gross pay subtotal */}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 }}>
            <Text style={{ fontSize: 10, color: c.secondary, marginRight: 8 }}>Gross Pay</Text>
            <Text style={{ fontSize: 11, color: c.primary, fontFamily: "Helvetica-Bold" }}>{currency} {grossPay}</Text>
          </View>

          {/* Deductions */}
          <Text style={[s.label, { marginBottom: 6 }]}>Deductions</Text>
          <View style={s.table}>
            {deductionRows.map((row, i) => (
              <View key={row.label} style={i < deductionRows.length - 1 ? s.tableRow : s.tableRowLast}>
                <Text style={[s.tableCellSecondary, { flex: 1 }]}>{row.label}</Text>
                <Text style={[s.tableCellRight, { flex: 0.5 }]}>{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Net pay */}
          <View style={s.callout}>
            <Text style={s.calloutLabel}>Net Pay</Text>
            <Text style={s.calloutAmount}>{currency} {netPay}</Text>
            {paidAt && <Text style={s.calloutSub}>Paid on {paidAt}</Text>}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {companyName} · Automatically generated payslip for {month} {year}. Please keep this document for your records. Contact HR if you have any questions.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Generate helpers ─────────────────────────────────────────────────────────

export async function generateInvoicePDF(props: InvoiceSentEmailProps): Promise<Buffer> {
  return renderToBuffer(<InvoicePDF {...props} />);
}

export async function generatePayslipPDF(props: PayslipEmailProps): Promise<Buffer> {
  return renderToBuffer(<PayslipPDF {...props} />);
}
