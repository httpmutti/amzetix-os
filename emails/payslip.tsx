import { Section, Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles, tokens as L } from "./layout";

export interface PayslipEmailProps {
  companyName: string;
  employeeName: string;
  employeeId: string;
  position?: string;
  department?: string;
  month: string;
  year: number;
  basicSalary: string;
  allowances: string;
  bonuses: string;
  overtimePay: string;
  grossPay: string;
  taxDeductions: string;
  otherDeductions: string;
  advances: string;
  netPay: string;
  currency: string;
  paidAt?: string;
}

function DataRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td className="email-table-cell" style={{ ...styles.tableCell, color: L.textSecondary }}>{label}</td>
      <td className="email-table-cell" style={{ ...styles.tableCell, textAlign: "right", fontWeight: bold ? 700 : 400 }}>{value}</td>
    </tr>
  );
}

export function PayslipEmail({
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
  return (
    <EmailLayout preview={`Payslip for ${month} ${year} — ${companyName}`} companyName={companyName}>
      <Text className="text-primary" style={styles.h1}>Payslip — {month} {year}</Text>
      <Text className="text-secondary" style={styles.lead}>
        Hi {employeeName}, your payslip for {month} {year} is ready. Please review the details below.
      </Text>

      {/* Employee info */}
      <Section style={{ marginBottom: 24 }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Employee</Text>
            <Text className="text-primary" style={styles.value}>{employeeName}</Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Employee ID</Text>
            <Text className="text-primary" style={{ ...styles.value, fontFamily: "monospace" }}>{employeeId}</Text>
          </Column>
        </Row>
        {(position || department) && (
          <Row>
            {position && (
              <Column style={{ width: "50%" }}>
                <Text className="text-muted" style={styles.label}>Position</Text>
                <Text className="text-primary" style={styles.value}>{position}</Text>
              </Column>
            )}
            {department && (
              <Column style={{ width: "50%" }}>
                <Text className="text-muted" style={styles.label}>Department</Text>
                <Text className="text-primary" style={styles.value}>{department}</Text>
              </Column>
            )}
          </Row>
        )}
      </Section>

      {/* Earnings */}
      <Text className="text-muted" style={{ ...styles.label, marginBottom: 8 }}>Earnings</Text>
      <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${L.border}`, borderRadius: 6, marginBottom: 16 }}>
        <tbody>
          <DataRow label="Basic Salary"  value={`${currency} ${basicSalary}`} />
          <DataRow label="Allowances"    value={`${currency} ${allowances}`} />
          <DataRow label="Bonuses"       value={`${currency} ${bonuses}`} />
          <DataRow label="Overtime Pay"  value={`${currency} ${overtimePay}`} />
          <DataRow label="Gross Pay"     value={`${currency} ${grossPay}`} bold />
        </tbody>
      </table>

      {/* Deductions */}
      <Text className="text-muted" style={{ ...styles.label, marginBottom: 8 }}>Deductions</Text>
      <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${L.border}`, borderRadius: 6, marginBottom: 24 }}>
        <tbody>
          <DataRow label="Tax Deductions"   value={`${currency} ${taxDeductions}`} />
          <DataRow label="Other Deductions" value={`${currency} ${otherDeductions}`} />
          <DataRow label="Advances"         value={`${currency} ${advances}`} />
        </tbody>
      </table>

      {/* Net pay */}
      <Section className="email-callout" style={{ ...styles.callout, textAlign: "center" }}>
        <Text className="text-muted" style={{ ...styles.calloutText, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 6px" }}>Net Pay</Text>
        <Text className="text-primary" style={{ color: L.textPrimary, fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
          {currency} {netPay}
        </Text>
        {paidAt && (
          <Text className="text-muted" style={{ ...styles.calloutText, color: L.textMuted, fontSize: 11, marginTop: 6 }}>Paid on {paidAt}</Text>
        )}
      </Section>

      <Hr className="email-hr" style={styles.divider} />
      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0 }}>
        This is an automatically generated payslip. Please keep it for your records. Contact HR if you have any questions.
      </Text>
    </EmailLayout>
  );
}

export default PayslipEmail;
