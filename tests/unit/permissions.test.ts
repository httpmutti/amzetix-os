import { describe, it, expect } from "vitest";
import { hasPermission } from "@/lib/permissions";

describe("hasPermission", () => {
  describe("OWNER", () => {
    it("can do everything", () => {
      expect(hasPermission("OWNER", "invoices:create")).toBe(true);
      expect(hasPermission("OWNER", "payroll:approve")).toBe(true);
      expect(hasPermission("OWNER", "settings:owner_only")).toBe(true);
      expect(hasPermission("OWNER", "audit:view")).toBe(true);
      expect(hasPermission("OWNER", "withdrawals:create")).toBe(true);
    });
  });

  describe("ADMIN", () => {
    it("has most permissions but not owner-only", () => {
      expect(hasPermission("ADMIN", "invoices:create")).toBe(true);
      expect(hasPermission("ADMIN", "clients:edit")).toBe(true);
      expect(hasPermission("ADMIN", "settings:edit")).toBe(true);
      expect(hasPermission("ADMIN", "settings:owner_only")).toBe(false);
      expect(hasPermission("ADMIN", "withdrawals:create")).toBe(false);
    });
  });

  describe("MANAGER", () => {
    it("can view and edit work items but not financial admin", () => {
      expect(hasPermission("MANAGER", "tasks:edit")).toBe(true);
      expect(hasPermission("MANAGER", "projects:edit")).toBe(true);
      expect(hasPermission("MANAGER", "payroll:approve")).toBe(false);
      expect(hasPermission("MANAGER", "settings:edit")).toBe(false);
      expect(hasPermission("MANAGER", "audit:view")).toBe(false);
    });
  });

  describe("HR", () => {
    it("can manage team and leave but not invoices or settings", () => {
      expect(hasPermission("HR", "leave:approve")).toBe(true);
      expect(hasPermission("HR", "attendance:edit")).toBe(true);
      expect(hasPermission("HR", "invoices:create")).toBe(false);
      expect(hasPermission("HR", "settings:edit")).toBe(false);
    });
  });

  describe("EMPLOYEE", () => {
    it("can view own data and request leave", () => {
      expect(hasPermission("EMPLOYEE", "leave:request")).toBe(true);
      expect(hasPermission("EMPLOYEE", "leave:view_own")).toBe(true);
      expect(hasPermission("EMPLOYEE", "leave:approve")).toBe(false);
      expect(hasPermission("EMPLOYEE", "invoices:view")).toBe(false);
      expect(hasPermission("EMPLOYEE", "payroll:approve")).toBe(false);
    });
  });

  describe("CLIENT", () => {
    it("can only view notifications", () => {
      expect(hasPermission("CLIENT", "notifications:view")).toBe(true);
      expect(hasPermission("CLIENT", "invoices:view")).toBe(false);
      expect(hasPermission("CLIENT", "tasks:view")).toBe(false);
      expect(hasPermission("CLIENT", "leave:request")).toBe(false);
    });
  });
});
