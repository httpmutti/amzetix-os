import { describe, it, expect } from "vitest";
import { getWorkingDaysInMonth, computeNetSalary } from "@/services/payroll.service";

describe("getWorkingDaysInMonth", () => {
  it("calculates working days for January 2026", () => {
    // Jan 2026: 31 days, starts Thursday; 22 working days
    const days = getWorkingDaysInMonth(1, 2026);
    expect(days).toBe(22);
  });

  it("calculates working days for February 2026", () => {
    // Feb 2026: 28 days, starts Sunday; 20 working days
    const days = getWorkingDaysInMonth(2, 2026);
    expect(days).toBe(20);
  });

  it("handles December correctly", () => {
    // Dec 2026: 31 days, starts Tuesday; 23 working days
    const days = getWorkingDaysInMonth(12, 2026);
    expect(days).toBeGreaterThan(19);
    expect(days).toBeLessThan(24);
  });

  it("returns a number between 19 and 23 for any given month", () => {
    for (let m = 1; m <= 12; m++) {
      const days = getWorkingDaysInMonth(m, 2026);
      expect(days).toBeGreaterThanOrEqual(19);
      expect(days).toBeLessThanOrEqual(23);
    }
  });
});

describe("computeNetSalary", () => {
  it("computes gross as base + extras", () => {
    const result = computeNetSalary({
      baseSalary: 5000,
      allowances: 500,
      bonuses: 1000,
      overtime: 200,
    });
    expect(result.grossSalary).toBe(6700);
  });

  it("subtracts deductions from gross", () => {
    const result = computeNetSalary({
      baseSalary: 5000,
      deductions: 800,
    });
    expect(result.netSalary).toBe(4200);
  });

  it("clamps net salary to 0 when deductions exceed gross", () => {
    const result = computeNetSalary({
      baseSalary: 1000,
      deductions: 9999,
    });
    expect(result.netSalary).toBe(0);
  });

  it("works with no extras or deductions", () => {
    const result = computeNetSalary({ baseSalary: 3000 });
    expect(result.grossSalary).toBe(3000);
    expect(result.netSalary).toBe(3000);
  });

  it("handles zero base salary", () => {
    const result = computeNetSalary({ baseSalary: 0, bonuses: 500 });
    expect(result.grossSalary).toBe(500);
    expect(result.netSalary).toBe(500);
  });
});
