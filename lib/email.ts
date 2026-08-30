import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-sesv2";
import { render } from "@react-email/render";
import { InvoiceSentEmail, type InvoiceSentEmailProps } from "@/emails/invoice-sent";
import { PortalInviteEmail, type PortalInviteEmailProps } from "@/emails/portal-invite";
import { PayslipEmail, type PayslipEmailProps } from "@/emails/payslip";
import { LeaveRequestEmail, type LeaveRequestEmailProps } from "@/emails/leave-request";
import { LeaveApprovedEmail, type LeaveApprovedEmailProps } from "@/emails/leave-approved";
import { LeaveRejectedEmail, type LeaveRejectedEmailProps } from "@/emails/leave-rejected";
import { TaskAssignedEmail, type TaskAssignedEmailProps } from "@/emails/task-assigned";
import { WelcomeEmployeeEmail, type WelcomeEmployeeEmailProps } from "@/emails/welcome-employee";

// Lazily created so the transporter is built once and reused across requests
let _transporter: nodemailer.Transporter | null = null;

function sanitizeAwsKey(key?: string): string | undefined {
  if (!key) return undefined;
  const trimmed = key.trim();
  // Handle accidental double paste of 20-character AWS access key
  if (trimmed.length === 40 && trimmed.slice(0, 20) === trimmed.slice(20)) {
    return trimmed.slice(0, 20);
  }
  return trimmed;
}

function getTransporter() {
  if (_transporter) return _transporter;

  const provider = (process.env.EMAIL_PROVIDER ?? "smtp").toLowerCase().trim();

  if (provider === "ses") {
    const sesRegion = process.env.AWS_SES_REGION?.trim();
    const rawKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
    const sesAccessKeyId = sanitizeAwsKey(rawKeyId);
    const sesSecretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY?.trim();

    if (sesRegion && sesAccessKeyId && sesSecretAccessKey) {
      console.log(`[email] Initializing Amazon SES v2 transport (region: ${sesRegion})`);
      const sesClient = new aws.SESv2Client({
        region: sesRegion,
        credentials: {
          accessKeyId: sesAccessKeyId,
          secretAccessKey: sesSecretAccessKey,
        },
      });

      _transporter = nodemailer.createTransport({
        SES: { sesClient, SendEmailCommand: aws.SendEmailCommand },
      });
      return _transporter;
    } else {
      console.warn("[email] EMAIL_PROVIDER=ses was set, but SES credentials are missing. Falling back to SMTP.");
    }
  }

  // Default: SMTP
  console.log("[email] Initializing SMTP transport");
  _transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_SERVER_PORT ?? "587"),
    secure: false, // STARTTLS on 587
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
  return _transporter;
}

interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Attachment[];
}

async function send({ to, subject, html, replyTo, attachments }: SendOptions) {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM ?? `AMZETIX <${process.env.EMAIL_SERVER_USER ?? "devmuttitious@gmail.com"}>`;

  const info = await transporter.sendMail({
    from: fromAddress,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });
  console.log("[email] sent:", info.messageId);
  return info;
}

// ─── Module senders ──────────────────────────────────────────────────────────

export async function sendInvoiceEmail(props: InvoiceSentEmailProps, to: string, attachPdf = true) {
  const [html, pdfBuffer] = await Promise.all([
    render(InvoiceSentEmail(props)),
    attachPdf ? import("@/lib/pdf").then((m) => m.generateInvoicePDF(props)) : Promise.resolve(null),
  ]);
  return send({
    to,
    subject: `Invoice ${props.invoiceNumber} from ${props.companyName} — ${props.currency} ${props.total}`,
    html,
    ...(pdfBuffer ? {
      attachments: [{
        filename: `Invoice-${props.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    } : {}),
  });
}

export async function sendPortalInviteEmail(props: PortalInviteEmailProps, to: string) {
  const html = await render(PortalInviteEmail(props));
  return send({
    to,
    subject: `You've been invited to ${props.clientName}'s client portal — ${props.companyName}`,
    html,
  });
}

export async function sendPayslipEmail(props: PayslipEmailProps, to: string, attachPdf = true) {
  const [html, pdfBuffer] = await Promise.all([
    render(PayslipEmail(props)),
    attachPdf ? import("@/lib/pdf").then((m) => m.generatePayslipPDF(props)) : Promise.resolve(null),
  ]);
  return send({
    to,
    subject: `Your payslip for ${props.month} ${props.year} — ${props.companyName}`,
    html,
    ...(pdfBuffer ? {
      attachments: [{
        filename: `Payslip-${props.month}-${props.year}-${props.employeeName.replace(/\s+/g, "-")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    } : {}),
  });
}

export async function sendLeaveRequestEmail(props: LeaveRequestEmailProps, to: string | string[]) {
  const html = await render(LeaveRequestEmail(props));
  return send({
    to,
    subject: `Leave request from ${props.employeeName} — ${props.leaveType} (${props.totalDays} day${props.totalDays !== 1 ? "s" : ""})`,
    html,
  });
}

export async function sendLeaveApprovedEmail(props: LeaveApprovedEmailProps, to: string) {
  const html = await render(LeaveApprovedEmail(props));
  return send({
    to,
    subject: `Your ${props.leaveType} leave request has been approved`,
    html,
  });
}

export async function sendLeaveRejectedEmail(props: LeaveRejectedEmailProps, to: string) {
  const html = await render(LeaveRejectedEmail(props));
  return send({
    to,
    subject: `Your ${props.leaveType} leave request could not be approved`,
    html,
  });
}

export async function sendTaskAssignedEmail(props: TaskAssignedEmailProps, to: string) {
  const html = await render(TaskAssignedEmail(props));
  return send({
    to,
    subject: `[${props.projectName}] Task assigned to you: ${props.taskTitle}`,
    html,
  });
}

export async function sendWelcomeEmployeeEmail(props: WelcomeEmployeeEmailProps, to: string) {
  const html = await render(WelcomeEmployeeEmail(props));
  return send({
    to,
    subject: `Welcome to ${props.companyName}! Your account is ready`,
    html,
  });
}
