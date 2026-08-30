import { describe, it, expect } from "vitest";
import { calculateInvoiceTotals } from "@/services/invoice.service";

describe("calculateInvoiceTotals", () => {
  it("calculates subtotal from items", () => {
    const result = calculateInvoiceTotals({
      items: [
        { quantity: 3, unitPrice: 100 },
        { quantity: 2, unitPrice: 50 },
      ],
    });
    expect(result.subtotal).toBe(400);
  });

  it("returns zero discount when none specified", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 500 }],
    });
    expect(result.discountAmount).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(500);
  });

  it("applies percentage discount correctly", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 2000 }],
      discountType: "percentage",
      discountValue: 25,
    });
    expect(result.discountAmount).toBe(500);
    expect(result.total).toBe(1500);
  });

  it("applies fixed discount correctly", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discountType: "fixed",
      discountValue: 150,
    });
    expect(result.discountAmount).toBe(150);
    expect(result.total).toBe(850);
  });

  it("applies tax after discount", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discountType: "fixed",
      discountValue: 0,
      taxRate: 20,
    });
    expect(result.taxAmount).toBe(200);
    expect(result.total).toBe(1200);
  });

  it("applies both discount and tax in correct order", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 1000 }],
      discountType: "percentage",
      discountValue: 10,
      taxRate: 10,
    });
    // subtotal=1000, discount=100, afterDiscount=900, tax=90, total=990
    expect(result.subtotal).toBe(1000);
    expect(result.discountAmount).toBe(100);
    expect(result.taxAmount).toBe(90);
    expect(result.total).toBe(990);
  });

  it("handles empty items array", () => {
    const result = calculateInvoiceTotals({ items: [] });
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it("ignores null discountType", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPrice: 500 }],
      discountType: null,
      discountValue: 100,
    });
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(500);
  });
});
