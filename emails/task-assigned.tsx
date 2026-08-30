import { Link, Section, Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles, tokens as L } from "./layout";

export interface TaskAssignedEmailProps {
  companyName: string;
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  taskDescription?: string;
  projectName: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  dashboardUrl: string;
}

const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  LOW:    { color: "#2563eb", bg: "#eff6ff", border: "#dbeafe" },
  MEDIUM: { color: "#d97706", bg: "#fffbeb", border: "#fef3c7" },
  HIGH:   { color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
  URGENT: { color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
};

export function TaskAssignedEmail({
  companyName,
  assigneeName,
  assignerName,
  taskTitle,
  taskDescription,
  projectName,
  priority,
  dueDate,
  dashboardUrl,
}: TaskAssignedEmailProps) {
  const p = priorityConfig[priority] ?? priorityConfig.MEDIUM;

  return (
    <EmailLayout preview={`New task: ${taskTitle} — ${projectName}`} companyName={companyName}>
      <Text className="text-primary" style={styles.h1}>Task Assigned to You</Text>
      <Text className="text-secondary" style={styles.lead}>
        Hi {assigneeName}, <strong>{assignerName}</strong> has assigned you a new task in <strong>{projectName}</strong>.
      </Text>

      {/* Task card */}
      <Section className="email-callout" style={styles.callout}>
        <Text className="text-primary" style={{ color: L.textPrimary, fontSize: 15, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>
          {taskTitle}
        </Text>
        {taskDescription && (
          <Text className="text-secondary" style={{ color: L.textSecondary, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {taskDescription}
          </Text>
        )}
      </Section>

      <Section style={{ marginBottom: 24 }}>
        <Row>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Project</Text>
            <Text className="text-primary" style={styles.value}>{projectName}</Text>
          </Column>
          <Column style={{ width: "50%" }}>
            <Text className="text-muted" style={styles.label}>Priority</Text>
            <Text style={{ ...styles.value, color: p.color }}>{priority}</Text>
          </Column>
        </Row>
        {dueDate && (
          <Row>
            <Column>
              <Text className="text-muted" style={styles.label}>Due Date</Text>
              <Text className="text-primary" style={styles.value}>{dueDate}</Text>
            </Column>
          </Row>
        )}
      </Section>

      <Section style={{ textAlign: "center", margin: "0 0 8px" }}>
        <Link href={dashboardUrl} className="email-btn" style={styles.cta}>View Task</Link>
      </Section>

      <Hr className="email-hr" style={styles.divider} />
      <Text className="text-muted" style={{ color: L.textMuted, fontSize: 12, margin: 0 }}>
        Reply to this email or contact {assignerName} if you have questions about this task.
      </Text>
    </EmailLayout>
  );
}

export default TaskAssignedEmail;
