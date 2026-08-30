import { Section, Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles, tokens as L } from "./layout";

export interface LeaveRejectedEmailProps {
  companyName: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  rejectedBy: string;
  reason?: string;
}

export function LeaveRejectedEmail({
  companyName,
  employeeName,
  leaveType,
  startDate,
  endDate,
  totalDays,
  rejectedBy,
  reason,
}: LeaveRejectedEmailProps) {
  return (
    <EmailLayout preview={`Your ${leaveType} leave request was not approved`} companyName={companyName}>
      <Text className="text-primary" style={styles.h1}>Leave Request Not Approved</Text>
      <Text className="text-secondary" style={styles.lead}>
        Hi {employeeName}, unfortunately your leave request could not be approved at this time. Please reach out to HR or your manager to discuss alternatives.
      </Text>

      {/* Status badge */}
      <Section style={{ ...styles.callout, backgroundColor: L.dangerBg, border: `1px solid ${L.dangerBorder}`, textAlign: "center", marginBottom: 24 }}>
        <Text style={{ color: L.danger, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Not Approved</Text>
        <Text style={{ color: L.danger, fontSize: 13, margin: 0 }}>
          {leaveType} · {totalDays} day{totalDays !== 1 ? "s" : ""}
        </Text>
      </Section>

      <Section style={{ marginBottom: 24 }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Requested From</Text>
            <Text className="text-primary" style={styles.value}>{startDate}</Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Requested To</Text>
            <Text className="text-primary" style={styles.value}>{endDate}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className="text-muted" style={styles.label}>Reviewed By</Text>
            <Text className="text-primary" style={styles.value}>{rejectedBy}</Text>
          </Column>
        </Row>
      </Section>

      {reason && (
        <Section style={{ ...styles.callout, backgroundColor: L.dangerBg, border: `1px solid ${L.dangerBorder}` }}>
          <Text style={{ color: L.danger, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 6px" }}>Reason</Text>
          <Text style={{ color: L.danger, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{reason}</Text>
        </Section>
      )}

      <Hr className="email-hr" style={styles.divider} />
      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0 }}>
        You can submit a new request with different dates. Contact {rejectedBy} or HR directly for further guidance.
      </Text>
    </EmailLayout>
  );
}

export default LeaveRejectedEmail;
