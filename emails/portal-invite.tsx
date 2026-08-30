import { Link, Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles, tokens as L } from "./layout";

export interface PortalInviteEmailProps {
  companyName: string;
  clientName: string;
  recipientName: string;
  email: string;
  temporaryPassword: string;
  portalUrl: string;
}

export function PortalInviteEmail({
  companyName,
  clientName,
  recipientName,
  email,
  temporaryPassword,
  portalUrl,
}: PortalInviteEmailProps) {
  return (
    <EmailLayout preview={`You've been invited to the ${clientName} client portal`} companyName={companyName}>
      <Text className="text-primary" style={styles.h1}>Welcome to Your Client Portal</Text>
      <Text className="text-secondary" style={styles.lead}>
        Hi {recipientName}, {companyName} has granted you access to the client portal for <strong>{clientName}</strong>. You can view invoices, project updates, and documents from your portal.
      </Text>

      <Section className="email-callout" style={styles.callout}>
        <Text className="text-primary" style={{ ...styles.calloutText, color: L.textPrimary, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14 }}>Your Login Credentials</Text>
        <Text className="text-muted" style={styles.label}>Email</Text>
        <Text className="text-primary" style={{ ...styles.value, fontFamily: "monospace", marginBottom: 14 }}>{email}</Text>
        <Text className="text-muted" style={styles.label}>Temporary Password</Text>
        <Text className="text-primary" style={{ ...styles.value, fontFamily: "monospace", letterSpacing: 2 }}>{temporaryPassword}</Text>
        <Text className="text-muted" style={{ ...styles.calloutText, color: L.textMuted, fontSize: 11, marginTop: 6 }}>
          Please change your password after your first login.
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
        <Link href={portalUrl} className="email-btn" style={styles.cta}>Access Your Portal</Link>
      </Section>

      <Hr className="email-hr" style={styles.divider} />
      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0 }}>
        If you did not expect this invitation, please disregard this email. Your account will remain inactive until you log in.
      </Text>
    </EmailLayout>
  );
}

export default PortalInviteEmail;
