import { Section, Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles, tokens as L } from "./layout";

export interface LeaveRequestEmailProps {
  companyName: string;
  hrName: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  requestId: string;
  dashboardUrl: string;
}

export function LeaveRequestEmail({
  companyName,
  hrName,
  employeeName,
  leaveType,
  startDate,
  endDate,
  totalDays,
  reason,
  requestId,
}: LeaveRequestEmailProps) {
  return (
    <EmailLayout preview={`Leave request from ${employeeName} — ${leaveType} (${totalDays} day${totalDays !== 1 ? "s" : ""})`} companyName={companyName}>
      <Text className="text-primary" style={styles.h1}>New Leave Request</Text>
      <Text className="text-secondary" style={styles.lead}>
        Hi {hrName}, <strong>{employeeName}</strong> has submitted a leave request that requires your review.
      </Text>

      <Section style={{ marginBottom: 24 }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Employee</Text>
            <Text className="text-primary" style={styles.value}>{employeeName}</Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Leave Type</Text>
            <Text className="text-primary" style={styles.value}>{leaveType}</Text>
          </Column>
        </Row>
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
            <Text className="text-muted" style={styles.label}>Duration</Text>
            <Text className="text-primary" style={styles.value}>{totalDays} day{totalDays !== 1 ? "s" : ""}</Text>
          </Column>
        </Row>
      </Section>

      {reason && (
        <Section className="email-callout" style={styles.callout}>
          <Text className="text-muted" style={{ ...styles.label, marginBottom: 6 }}>Reason</Text>
          <Text className="callout-text" style={{ ...styles.calloutText, color: L.textSecondary }}>{reason}</Text>
        </Section>
      )}

      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 11, margin: "16px 0 0", fontFamily: "monospace" }}>
        Request ID: {requestId} — Log in to the dashboard to approve or reject.
      </Text>

      <Hr className="email-hr" style={styles.divider} />
      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0 }}>
        Please respond promptly so the employee can plan accordingly.
      </Text>
    </EmailLayout>
  );
}

export default LeaveRequestEmail;
