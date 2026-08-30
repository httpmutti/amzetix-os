import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, generateId, truncate, getInitials, calculateInvoiceTotal } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats USD", () => {
    expect(formatCurrency(1234.56, "USD")).toContain("1,234.56");
    expect(formatCurrency(1234.56, "USD")).toContain("$");
  });

  it("formats GBP", () => {
    expect(formatCurrency(999, "GBP")).toContain("999");
    expect(formatCurrency(999, "GBP")).toContain("£");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });

  it("handles null/undefined gracefully", () => {
    expect(() => formatCurrency(null as unknown as number)).not.toThrow();
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const d = new Date("2026-01-15");
    const result = formatDate(d);
    expect(result).toContain("2026");
  });

  it("formats an ISO string", () => {
    const result = formatDate("2026-08-22T00:00:00Z");
    expect(result).toContain("2026");
  });

  it("returns '—' for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns '—' for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("generateId", () => {
  it("generates correct prefix and zero-padded sequence", () => {
    expect(generateId("INV", 1)).toBe("INV-0001");
    expect(generateId("EXP", 42)).toBe("EXP-0042");
    expect(generateId("PAY", 9999)).toBe("PAY-9999");
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    const result = truncate("Hello world this is a long string", 10);
    expect(result.length).toBeLessThanOrEqual(13); // 10 + "..."
    expect(result).toContain("...");
  });

  it("does not truncate short strings", () => {
    expect(truncate("Hello", 50)).toBe("Hello");
  });
});

describe("getInitials", () => {
  it("returns two letters for full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("returns one letter for single name", () => {
    expect(getInitials("Alice")).toBe("A");
  });
});

describe("calculateInvoiceTotal", () => {
  it("applies percentage discount on subtotal", () => {
    const result = calculateInvoiceTotal({
      subtotal: 1000,
      discountType: "percentage",
      discountValue: 10,
    });
    expect(result.discountAmount).toBe(100);
    expect(result.total).toBe(900);
  });

  it("applies fixed discount on subtotal", () => {
    const result = calculateInvoiceTotal({
      subtotal: 500,
      discountType: "fixed",
      discountValue: 50,
    });
    expect(result.discountAmount).toBe(50);
    expect(result.total).toBe(450);
  });

  it("applies tax after discount", () => {
    const result = calculateInvoiceTotal({
      subtotal: 1000,
      discountType: null,
      taxRate: 10,
    });
    expect(result.taxAmount).toBe(100);
    expect(result.total).toBe(1100);
  });

  it("returns zero discount when type is null", () => {
    const result = calculateInvoiceTotal({ subtotal: 800 });
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(800);
  });
});
