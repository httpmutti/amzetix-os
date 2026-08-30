import { prisma } from "@/lib/prisma";

interface AuditParams {
  performedById: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description: string;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        performedById: params.performedById,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValues: params.oldValues as object ?? undefined,
        newValues: params.newValues as object ?? undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        description: params.description,
      },
    });
  } catch (error) {
    // Audit log failure should never crash the application
    console.error("Audit log failed:", error);
  }
}

export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  SOFT_DELETE: "SOFT_DELETE",
  RESTORE: "RESTORE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  SEND: "SEND",
  CLOSE: "CLOSE",
  OPEN: "OPEN",
  PAYMENT_RECORDED: "PAYMENT_RECORDED",
  STATUS_CHANGE: "STATUS_CHANGE",
} as const;
