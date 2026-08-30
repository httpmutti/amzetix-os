import { Section, Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles, tokens as L } from "./layout";

export interface LeaveApprovedEmailProps {
  companyName: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  approvedBy: string;
  note?: string;
}

export function LeaveApprovedEmail({
  companyName,
  employeeName,
  leaveType,
  startDate,
  endDate,
  totalDays,
  approvedBy,
  note,
}: LeaveApprovedEmailProps) {
  return (
    <EmailLayout preview={`Your ${leaveType} leave has been approved — ${startDate} to ${endDate}`} companyName={companyName}>
      <Text className="text-primary" style={styles.h1}>Leave Request Approved</Text>
      <Text className="text-secondary" style={styles.lead}>
        Hi {employeeName}, your leave request has been approved. Enjoy your time off!
      </Text>

      {/* Status badge */}
      <Section style={{ ...styles.callout, backgroundColor: L.successBg, border: `1px solid ${L.successBorder}`, textAlign: "center", marginBottom: 24 }}>
        <Text style={{ color: L.success, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Approved</Text>
        <Text style={{ color: L.success, fontSize: 13, margin: 0 }}>
          {leaveType} · {totalDays} day{totalDays !== 1 ? "s" : ""}
        </Text>
      </Section>

      <Section style={{ marginBottom: 24 }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>From</Text>
            <Text className="text-primary" style={styles.value}>{startDate}</Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>To</Text>
            <Text className="text-primary" style={styles.value}>{endDate}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className="text-muted" style={styles.label}>Approved By</Text>
            <Text className="text-primary" style={styles.value}>{approvedBy}</Text>
          </Column>
        </Row>
      </Section>

      {note && (
        <Section className="email-callout" style={styles.callout}>
          <Text className="text-muted" style={{ ...styles.label, marginBottom: 6 }}>Note from {approvedBy}</Text>
          <Text className="callout-text" style={{ ...styles.calloutText, color: L.textSecondary }}>{note}</Text>
        </Section>
      )}

      <Hr className="email-hr" style={styles.divider} />
      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0 }}>
        Please ensure your work is handed off before your leave begins. Contact HR if you need to make any changes.
      </Text>
    </EmailLayout>
  );
}

export default LeaveApprovedEmail;
