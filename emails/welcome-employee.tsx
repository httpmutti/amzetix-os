import { Link, Section, Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles, tokens as L } from "./layout";

export interface WelcomeEmployeeEmailProps {
  companyName: string;
  employeeName: string;
  position: string;
  department?: string;
  startDate: string;
  email: string;
  temporaryPassword: string;
  dashboardUrl: string;
  hrName?: string;
  hrEmail?: string;
}

export function WelcomeEmployeeEmail({
  companyName,
  employeeName,
  position,
  department,
  startDate,
  email,
  temporaryPassword,
  dashboardUrl,
  hrName,
  hrEmail,
}: WelcomeEmployeeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ${companyName}! Your account is ready — start date ${startDate}`} companyName={companyName}>
      <Text className="text-primary" style={styles.h1}>Welcome to {companyName}!</Text>
      <Text className="text-secondary" style={styles.lead}>
        Hi {employeeName}, we're excited to have you join us as <strong>{position}</strong>
        {department ? ` in the ${department} department` : ""}. Your employee account is ready to go.
      </Text>

      {/* Role details */}
      <Section style={{ marginBottom: 24 }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Your Role</Text>
            <Text className="text-primary" style={styles.value}>{position}</Text>
          </Column>
          {department && (
            <Column style={{ width: "50%" }}>
              <Text className="text-muted" style={styles.label}>Department</Text>
              <Text className="text-primary" style={styles.value}>{department}</Text>
            </Column>
          )}
        </Row>
        <Row>
          <Column>
            <Text className="text-muted" style={styles.label}>Start Date</Text>
            <Text className="text-primary" style={styles.value}>{startDate}</Text>
          </Column>
        </Row>
      </Section>

      {/* Credentials */}
      <Section className="email-callout" style={styles.callout}>
        <Text className="text-primary" style={{ ...styles.calloutText, color: L.textPrimary, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>
          Your Login Credentials
        </Text>
        <Text className="text-muted" style={styles.label}>Email / Username</Text>
        <Text className="text-primary" style={{ ...styles.value, fontFamily: "monospace", marginBottom: 14 }}>{email}</Text>
        <Text className="text-muted" style={styles.label}>Temporary Password</Text>
        <Text className="text-primary" style={{ ...styles.value, fontFamily: "monospace", letterSpacing: 2 }}>{temporaryPassword}</Text>
        <Text className="text-muted" style={{ ...styles.calloutText, color: L.textMuted, fontSize: 11, marginTop: 6 }}>
          Please log in and change your password on your first day.
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
        <Link href={dashboardUrl} className="email-btn" style={styles.cta}>Access Employee Portal</Link>
      </Section>

      {(hrName || hrEmail) && (
        <Section style={{ marginBottom: 0 }}>
          <Text className="text-secondary" style={{ color: L.textSecondary, fontSize: 13, margin: 0 }}>
            Questions before your start date? Contact{" "}
            {hrName && hrEmail
              ? <>{hrName} at <a href={`mailto:${hrEmail}`} style={{ color: L.textPrimary }}>{hrEmail}</a></>
              : hrName
              ? hrName
              : <a href={`mailto:${hrEmail}`} style={{ color: L.textPrimary }}>{hrEmail}</a>}.
          </Text>
        </Section>
      )}

      <Hr className="email-hr" style={styles.divider} />
      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0 }}>
        We look forward to working with you. See you on {startDate}!
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmployeeEmail;
