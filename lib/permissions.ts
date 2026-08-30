import type { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────
// RBAC — Role hierarchy and permission definitions
// ─────────────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 100,
  ADMIN: 90,
  MANAGER: 70,
  PROJECT_MANAGER: 60,
  HR: 55,
  ACCOUNTANT: 55,
  EMPLOYEE: 30,
  CLIENT: 10,
};

export type Permission =
  // Dashboard
  | "dashboard:view"
  | "dashboard:view_financial"
  // CRM
  | "crm:view"
  | "crm:create"
  | "crm:edit"
  | "crm:delete"
  | "crm:convert"
  // Clients
  | "clients:view"
  | "clients:create"
  | "clients:edit"
  | "clients:delete"
  | "clients:view_financials"
  // Contacts
  | "contacts:view"
  | "contacts:create"
  | "contacts:edit"
  | "contacts:delete"
  // Projects
  | "projects:view"
  | "projects:view_all"
  | "projects:create"
  | "projects:edit"
  | "projects:delete"
  // Tasks
  | "tasks:view"
  | "tasks:view_all"
  | "tasks:create"
  | "tasks:edit"
  | "tasks:delete"
  | "tasks:assign"
  // Time tracking
  | "time:track"
  | "time:view_all"
  | "time:edit"
  // Team
  | "team:view"
  | "team:create"
  | "team:edit"
  | "team:delete"
  | "team:view_salary"
  // Attendance
  | "attendance:view_own"
  | "attendance:view_all"
  | "attendance:checkin"
  | "attendance:edit"
  // Leave
  | "leave:view_own"
  | "leave:view_all"
  | "leave:request"
  | "leave:approve"
  | "leave:edit"
  // Payroll
  | "payroll:view_own"
  | "payroll:view_all"
  | "payroll:create"
  | "payroll:approve"
  | "payroll:edit"
  // Invoices
  | "invoices:view"
  | "invoices:create"
  | "invoices:edit"
  | "invoices:delete"
  | "invoices:send"
  // Payments
  | "payments:view"
  | "payments:create"
  | "payments:edit"
  | "payments:delete"
  // Expenses
  | "expenses:view"
  | "expenses:view_all"
  | "expenses:create"
  | "expenses:edit"
  | "expenses:delete"
  // Revenue
  | "revenue:view"
  // Reports
  | "reports:view"
  | "reports:view_financial"
  | "reports:export"
  // Documents
  | "documents:view"
  | "documents:upload"
  | "documents:delete"
  // Notifications
  | "notifications:view"
  // Settings
  | "settings:view"
  | "settings:edit"
  | "settings:owner_only"
  // Audit logs
  | "audit:view"
  // Owner withdrawals
  | "withdrawals:view"
  | "withdrawals:create"
  // Financial periods
  | "periods:close"
  // Client portal
  | "portal:view";

const OWNER_PERMISSIONS: Permission[] = [
  "dashboard:view", "dashboard:view_financial",
  "crm:view", "crm:create", "crm:edit", "crm:delete", "crm:convert",
  "clients:view", "clients:create", "clients:edit", "clients:delete", "clients:view_financials",
  "contacts:view", "contacts:create", "contacts:edit", "contacts:delete",
  "projects:view", "projects:view_all", "projects:create", "projects:edit", "projects:delete",
  "tasks:view", "tasks:view_all", "tasks:create", "tasks:edit", "tasks:delete", "tasks:assign",
  "time:track", "time:view_all", "time:edit",
  "team:view", "team:create", "team:edit", "team:delete", "team:view_salary",
  "attendance:view_own", "attendance:view_all", "attendance:checkin", "attendance:edit",
  "leave:view_own", "leave:view_all", "leave:request", "leave:approve", "leave:edit",
  "payroll:view_own", "payroll:view_all", "payroll:create", "payroll:approve", "payroll:edit",
  "invoices:view", "invoices:create", "invoices:edit", "invoices:delete", "invoices:send",
  "payments:view", "payments:create", "payments:edit", "payments:delete",
  "expenses:view", "expenses:view_all", "expenses:create", "expenses:edit", "expenses:delete",
  "revenue:view",
  "reports:view", "reports:view_financial", "reports:export",
  "documents:view", "documents:upload", "documents:delete",
  "notifications:view",
  "settings:view", "settings:edit", "settings:owner_only",
  "audit:view",
  "withdrawals:view", "withdrawals:create",
  "periods:close",
];

const ADMIN_PERMISSIONS: Permission[] = OWNER_PERMISSIONS.filter(
  (p) => p !== "settings:owner_only" && p !== "withdrawals:create"
);

const MANAGER_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "crm:view", "crm:create", "crm:edit",
  "clients:view", "clients:view_financials",
  "contacts:view", "contacts:create", "contacts:edit",
  "projects:view", "projects:view_all", "projects:create", "projects:edit",
  "tasks:view", "tasks:view_all", "tasks:create", "tasks:edit", "tasks:assign",
  "time:track", "time:view_all",
  "team:view",
  "attendance:view_own", "attendance:view_all", "attendance:checkin",
  "leave:view_own", "leave:view_all", "leave:request", "leave:approve",
  "payroll:view_all",
  "invoices:view",
  "payments:view",
  "expenses:view", "expenses:view_all", "expenses:create",
  "revenue:view",
  "reports:view",
  "documents:view", "documents:upload",
  "notifications:view",
];

const PROJECT_MANAGER_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "clients:view",
  "contacts:view",
  "projects:view", "projects:view_all", "projects:edit",
  "tasks:view", "tasks:view_all", "tasks:create", "tasks:edit", "tasks:assign",
  "time:track", "time:view_all",
  "team:view",
  "attendance:view_own", "attendance:checkin",
  "leave:view_own", "leave:request",
  "documents:view", "documents:upload",
  "notifications:view",
];

const HR_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "team:view", "team:create", "team:edit", "team:view_salary",
  "attendance:view_own", "attendance:view_all", "attendance:checkin", "attendance:edit",
  "leave:view_own", "leave:view_all", "leave:request", "leave:approve", "leave:edit",
  "payroll:view_all", "payroll:create", "payroll:edit",
  "reports:view",
  "documents:view", "documents:upload",
  "notifications:view",
];

const ACCOUNTANT_PERMISSIONS: Permission[] = [
  "dashboard:view", "dashboard:view_financial",
  "clients:view", "clients:view_financials",
  "invoices:view", "invoices:create", "invoices:edit", "invoices:send",
  "payments:view", "payments:create", "payments:edit",
  "expenses:view", "expenses:view_all", "expenses:create", "expenses:edit",
  "revenue:view",
  "payroll:view_all",
  "reports:view", "reports:view_financial", "reports:export",
  "documents:view", "documents:upload",
  "notifications:view",
  "periods:close",
];

const EMPLOYEE_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "projects:view",
  "tasks:view", "tasks:edit",
  "time:track",
  "attendance:view_own", "attendance:checkin",
  "leave:view_own", "leave:request",
  "payroll:view_own",
  "documents:view",
  "notifications:view",
];

const CLIENT_PERMISSIONS: Permission[] = [
  "portal:view",
  "notifications:view",
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: OWNER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  PROJECT_MANAGER: PROJECT_MANAGER_PERMISSIONS,
  HR: HR_PERMISSIONS,
  ACCOUNTANT: ACCOUNTANT_PERMISSIONS,
  EMPLOYEE: EMPLOYEE_PERMISSIONS,
  CLIENT: CLIENT_PERMISSIONS,
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function isAtLeast(role: UserRole, minimum: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}

// Internal roles (not clients)
export const INTERNAL_ROLES: UserRole[] = [
  "OWNER", "ADMIN", "MANAGER", "PROJECT_MANAGER", "HR", "ACCOUNTANT", "EMPLOYEE",
];
