import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

// ─── Token-matched palette (from styles/tokens.css) ──────────────────────────
// Light
const L = {
  pageBg:       "#f7f7f8",
  cardBg:       "#ffffff",
  headerBg:     "#0a0a0a",   // --color-black  (same as primary button)
  border:       "#e4e4e7",   // --color-neutral-200
  textPrimary:  "#0a0a0a",   // --color-black
  textSecondary:"#52525b",   // --color-neutral-600
  textMuted:    "#a1a1aa",   // --color-neutral-400
  calloutBg:    "#f4f4f5",   // --color-neutral-100
  calloutBorder:"#d4d4d8",   // --color-neutral-300
  btnBg:        "#0a0a0a",
  btnText:      "#ffffff",
  tableHeadBg:  "#f4f4f5",
  success:      "#16a34a",   // --color-success-600
  successBg:    "#f0fdf4",   // --color-success-50
  successBorder:"#dcfce7",
  danger:       "#dc2626",   // --color-danger-500
  dangerBg:     "#fef2f2",   // --color-danger-50
  dangerBorder: "#fee2e2",   // --color-danger-100
  warning:      "#d97706",   // --color-warning-600
  info:         "#2563eb",   // --color-info-600
};

// Dark (used in @media prefers-color-scheme: dark)
const D = {
  pageBg:       "#0a0a0a",   // --surface-page dark
  cardBg:       "#131315",   // --surface-card dark
  headerBg:     "#0f0f11",   // darker than card, proper anchor
  border:       "#2a2a2f",   // --color-neutral-200 dark
  textPrimary:  "#f5f5f5",   // --text-primary dark
  textSecondary:"#a3a3a3",   // --text-secondary dark
  textMuted:    "#737373",   // --text-tertiary dark
  calloutBg:    "#202024",   // --color-neutral-100 dark
  calloutBorder:"#3a3a40",   // --color-neutral-300 dark
  btnBg:        "#e5e5e5",
  btnText:      "#0a0a0a",
  tableHeadBg:  "#1c1c1f",
};

// Logos (user-provided)
const LOGO_LIGHT = "https://res.cloudinary.com/dxbqlflap/image/upload/v1788032810/mailenium-ai/696581f90aba04b27318a2f2/logos/nna9l82fnpb6mjmdsqoi.png";
const LOGO_DARK  = "https://res.cloudinary.com/dxbqlflap/image/upload/v1788032834/mailenium-ai/696581f90aba04b27318a2f2/logos/c2nvizmufckmvflt6mhv.png";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  companyName?: string;
}

export function EmailLayout({ preview, children, companyName = "AMZETIX" }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        {/* Lock email to light-mode only — prevents Apple Mail / Gmail from
            auto-inverting the dark header to white in device dark mode */}
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body className="email-body" style={{ backgroundColor: L.pageBg, fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto" }}>

          {/* Header — always dark background, always white/transparent logo */}
          {/* Raw table so we can set bgcolor attribute — Gmail & Apple Mail respect
              bgcolor for dark-mode inversion decisions, unlike CSS background-color */}
          <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td
                  // @ts-ignore — bgcolor is a valid HTML attribute email clients honour
                  bgcolor={L.headerBg}
                  className="email-header"
                  style={{ backgroundColor: L.headerBg, borderRadius: "8px 8px 0 0", padding: "20px 32px" }}
                >
                  <img src={LOGO_DARK} alt={companyName} style={{ display: "block", height: 40, maxWidth: 220 }} />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Card body */}
          <Section className="email-card" style={{ backgroundColor: L.cardBg, padding: "32px 32px 24px", borderLeft: `1px solid ${L.border}`, borderRight: `1px solid ${L.border}` }}>
            {children}
          </Section>

          {/* Footer */}
          <Section className="email-footer" style={{ backgroundColor: L.cardBg, borderRadius: "0 0 8px 8px", padding: "16px 32px 24px", borderLeft: `1px solid ${L.border}`, borderRight: `1px solid ${L.border}`, borderBottom: `1px solid ${L.border}` }}>
            <Hr className="email-hr" style={{ borderColor: L.border, margin: "0 0 14px" }} />
            <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              This email was sent by {companyName}. If you received it by mistake, you can safely ignore it.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ─── Shared style helpers (token-matched) ─────────────────────────────────────

export const styles = {
  h1: {
    color: L.textPrimary,
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 8px",
    lineHeight: 1.3,
    letterSpacing: "-0.3px",
  } as React.CSSProperties,

  lead: {
    color: L.textSecondary,
    fontSize: 14,
    lineHeight: 1.6,
    margin: "0 0 24px",
  } as React.CSSProperties,

  label: {
    color: L.textMuted,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
    margin: "0 0 3px",
  },

  value: {
    color: L.textPrimary,
    fontSize: 14,
    fontWeight: 600,
    margin: "0 0 16px",
  } as React.CSSProperties,

  callout: {
    backgroundColor: L.calloutBg,
    border: `1px solid ${L.calloutBorder}`,
    borderRadius: 6,
    padding: "16px 20px",
    margin: "0 0 24px",
  } as React.CSSProperties,

  calloutText: {
    color: L.textSecondary,
    fontSize: 13,
    margin: 0,
    lineHeight: 1.5,
  } as React.CSSProperties,

  cta: {
    display: "inline-block",
    backgroundColor: L.btnBg,
    color: L.btnText,
    fontWeight: 600,
    fontSize: 13,
    borderRadius: 6,
    padding: "11px 22px",
    textDecoration: "none",
    letterSpacing: "0.1px",
  } as React.CSSProperties,

  tableHead: {
    backgroundColor: L.tableHeadBg,
    padding: "9px 14px",
    textAlign: "left" as const,
    fontSize: 10,
    fontWeight: 600,
    color: L.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.6px",
    borderBottom: `1px solid ${L.border}`,
  },

  tableCell: {
    padding: "11px 14px",
    fontSize: 13,
    color: L.textPrimary,
    borderBottom: `1px solid ${L.border}`,
  } as React.CSSProperties,

  divider: {
    borderColor: L.border,
    margin: "24px 0",
  } as React.CSSProperties,

  success: { color: L.success, fontWeight: 700 } as React.CSSProperties,
  danger:  { color: L.danger,  fontWeight: 700 } as React.CSSProperties,
  warning: { color: L.warning, fontWeight: 700 } as React.CSSProperties,

  mono: {
    fontFamily: "'Fira Code', 'Courier New', monospace",
    backgroundColor: L.calloutBg,
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 13,
  } as React.CSSProperties,
};

// Export tokens for use in individual templates
export { L as tokens, D as darkTokens };
