"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar, Cell,
} from "recharts";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useRevenueStore } from "@/lib/store/revenue.store";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CHART_COLORS = {
  revenue: "var(--color-success-500)",
  expenses: "var(--color-danger-500)",
};

const BAR_COLORS = [
  "var(--interactive-primary)", "var(--color-info-400)", "var(--color-warning-500)",
  "var(--color-danger-500)", "var(--color-success-500)", "var(--color-neutral-400)",
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2].map((y) => ({ value: String(y), label: String(y) }));

export function RevenueContent() {
  const { loadYear, getYear, loading } = useRevenueStore();
  const [year, setYear] = useState(String(currentYear));

  useEffect(() => { loadYear(year); }, [year, loadYear]);

  const data = getYear(year);
  const isLoading = loading[year];

  if (isLoading || (!data && !loading[year])) return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-64" />
    </div>
  );

  if (!data) return <p className="text-sm text-[var(--text-secondary)]">Failed to load revenue data.</p>;

  const { summary, monthly, expenseByCategory, withdrawals } = data;
  const profitPositive = summary.netProfit >= 0;

  const chartData = monthly.map(m => ({
    name: MONTH_SHORT[m.month - 1],
    Revenue: m.revenue,
    Expenses: m.expenses + m.payroll,
  }));

  const tooltipStyle = {
    background: "var(--surface-card)", border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--text-primary)",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">Financial overview for the selected year</p>
        <div className="w-28">
          <Select value={year} onValueChange={setYear} options={YEAR_OPTIONS} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: formatCurrency(summary.totalRevenue, "USD"), color: "var(--color-success-600)" },
          { label: "Total Costs", value: formatCurrency(summary.totalCosts, "USD"), color: "var(--color-danger-500)" },
          {
            label: "Net Profit",
            value: formatCurrency(Math.abs(summary.netProfit), "USD"),
            prefix: summary.netProfit < 0 ? "−" : "",
            color: profitPositive ? "var(--color-success-600)" : "var(--color-danger-500)",
          },
          { label: "Owner Withdrawals", value: formatCurrency(summary.totalWithdrawals, "USD"), color: "var(--color-warning-600)" },
        ].map(k => (
          <div key={k.label} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-4">
            <p className="text-xs text-[var(--text-secondary)] mb-1">{k.label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: k.color }}>
              {"prefix" in k ? k.prefix : ""}{k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">P&L Breakdown</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          {[
            { label: "Paid Invoices", value: formatCurrency(summary.totalRevenue, "USD"), color: "var(--color-success-600)" },
            { label: "Expenses", value: formatCurrency(summary.totalExpenses, "USD"), color: "var(--color-danger-500)" },
            { label: "Payroll", value: formatCurrency(summary.totalPayroll, "USD"), color: "var(--color-warning-600)" },
            { label: "Net Profit", value: (summary.netProfit < 0 ? "−" : "") + formatCurrency(Math.abs(summary.netProfit), "USD"), color: profitPositive ? "var(--color-success-600)" : "var(--color-danger-500)" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-[var(--text-tertiary)] mb-0.5">{item.label}</p>
              <p className="font-semibold tabular-nums" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">Monthly Trend</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="name" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }} />
            <Line type="monotone" dataKey="Revenue" stroke={CHART_COLORS.revenue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Expenses" stroke={CHART_COLORS.expenses} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">Expenses by Category</p>
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No expense data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expenseByCategory} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "var(--text-tertiary)", fontSize: 10 }} />
                <YAxis type="category" dataKey="category" width={130} tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                  tickFormatter={(v: string) => v.replace(/_/g, " ")} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} contentStyle={tooltipStyle} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Owner Withdrawals</p>
            <p className="text-sm font-bold tabular-nums text-[var(--color-warning-600)]">{formatCurrency(summary.totalWithdrawals, "USD")}</p>
          </div>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No withdrawals recorded.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
              {withdrawals.map(w => (
                <div key={w.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{w.description ?? "Withdrawal"}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {format(new Date(w.date), "MMM d, yyyy")} · {w.method.replace(/_/g, " ")}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums text-[var(--color-warning-600)]">{formatCurrency(Number(w.amount), w.currency)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
