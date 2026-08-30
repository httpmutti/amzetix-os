import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNow, isAfter } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── Date formatting ─────────────────────────────────────────────

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  return isAfter(new Date(), new Date(dueDate));
}

// ─── Currency / number formatting ────────────────────────────────

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "USD",
  compact = false
): string {
  if (amount === null || amount === undefined) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(num);
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercent(value: number | string | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `${num.toFixed(decimals)}%`;
}

export function formatHours(minutes: number | null | undefined): string {
  if (!minutes) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── ID generators ───────────────────────────────────────────────

export function generateId(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

// ─── General utilities ───────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, length = 50): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Convert snake_case / UPPER_CASE to Title Case
export function enumToLabel(value: string): string {
  return value
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}

// ─── Financial calculations (client-safe helpers) ────────────────

export function calculateInvoiceTotal(params: {
  subtotal: number;
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number;
  taxRate?: number;
}): {
  discountAmount: number;
  taxAmount: number;
  total: number;
} {
  const { subtotal, discountType, discountValue = 0, taxRate = 0 } = params;

  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (discountType === "fixed") {
    discountAmount = discountValue;
  }

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + taxAmount;

  return { discountAmount, taxAmount, total };
}

export function calculateProfitMargin(revenue: number, costs: number): number {
  if (revenue === 0) return 0;
  return ((revenue - costs) / revenue) * 100;
}

// ─── Array helpers ───────────────────────────────────────────────

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const group = String(item[key]);
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => {
    const val = item[key];
    const num = typeof val === "number" ? val : parseFloat(String(val));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
}
