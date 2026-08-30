import { Link, Section, Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles, tokens as L } from "./layout";

export interface InvoiceSentEmailProps {
  companyName: string;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: string;
  currency: string;
  portalUrl: string;
  paymentLink?: string;
  items?: { description: string; quantity: number; unitPrice: string; total: string }[];
}

export function InvoiceSentEmail({
  companyName,
  clientName,
  invoiceNumber,
  issueDate,
  dueDate,
  total,
  currency,
  portalUrl,
  paymentLink,
  items = [],
}: InvoiceSentEmailProps) {
  return (
    <EmailLayout preview={`Invoice ${invoiceNumber} — ${currency} ${total} due ${dueDate}`} companyName={companyName}>
      <Text className="text-primary" style={styles.h1}>Invoice {invoiceNumber}</Text>
      <Text className="text-secondary" style={styles.lead}>
        Hi {clientName}, please find your invoice details below. View and download it from your client portal.
      </Text>

      {/* Meta grid */}
      <Section style={{ marginBottom: 24 }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Invoice Number</Text>
            <Text className="text-primary" style={{ ...styles.value, fontFamily: "monospace" }}>{invoiceNumber}</Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Issue Date</Text>
            <Text className="text-primary" style={styles.value}>{issueDate}</Text>
          </Column>
        </Row>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Due Date</Text>
            <Text className="text-primary" style={styles.value}>{dueDate}</Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Currency</Text>
            <Text className="text-primary" style={styles.value}>{currency}</Text>
          </Column>
        </Row>
      </Section>

      {/* Line items */}
      {items.length > 0 && (
        <Section style={{ margin: "0 0 24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${L.border}`, borderRadius: 6 }}>
            <thead>
              <tr className="email-table-head">
                <th style={styles.tableHead}>Description</th>
                <th style={{ ...styles.tableHead, textAlign: "right" }}>Qty</th>
                <th style={{ ...styles.tableHead, textAlign: "right" }}>Unit Price</th>
                <th style={{ ...styles.tableHead, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="email-table-cell" style={styles.tableCell}>{item.description}</td>
                  <td className="email-table-cell" style={{ ...styles.tableCell, textAlign: "right" }}>{item.quantity}</td>
                  <td className="email-table-cell" style={{ ...styles.tableCell, textAlign: "right" }}>{item.unitPrice}</td>
                  <td className="email-table-cell" style={{ ...styles.tableCell, textAlign: "right", fontWeight: 600 }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Total */}
      <Section className="email-callout" style={{ ...styles.callout, textAlign: "center" }}>
        <Text className="text-muted" style={{ ...styles.calloutText, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 6px" }}>Total Amount Due</Text>
        <Text className="text-primary" style={{ color: L.textPrimary, fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>
          {currency} {total}
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "0 0 8px" }}>
        {paymentLink && (
          <Link href={paymentLink} className="email-btn" style={{ ...styles.cta, marginBottom: 8 }}>Pay Now</Link>
        )}
        <Link href={portalUrl} className="email-btn" style={paymentLink ? { ...styles.cta, backgroundColor: "transparent", border: `2px solid ${L.btnBg}`, color: L.btnBg } : styles.cta}>
          View Invoice in Portal
        </Link>
      </Section>

      <Hr className="email-hr" style={styles.divider} />
      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0 }}>
        Payment is due by {dueDate}. Reply to this email if you have any questions.
      </Text>
    </EmailLayout>
  );
}

export default InvoiceSentEmail;
