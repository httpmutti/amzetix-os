"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatNumber } from "@/lib/utils";

interface DataPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface RevenueChartProps {
  data: DataPoint[];
  currency?: string;
}

export function RevenueChart({ data, currency = "USD" }: RevenueChartProps) {
  const fmt = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return `${v}`;
  };

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 bg-[var(--surface-card)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Revenue vs Expenses Overview
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            12-Month Financial Performance ({currency})
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={4} barCategoryGap="24%">
          <CartesianGrid
            vertical={false}
            stroke="var(--border-subtle)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v: number, name: string) => [`${currency} ${formatNumber(v)}`, name]}
            contentStyle={{
              background: "var(--surface-overlay)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-md)",
            }}
            cursor={{ fill: "var(--interactive-secondary-hover)" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)", paddingTop: "8px" }}
          />
          <Bar dataKey="revenue" name="Revenue Collected" fill="var(--interactive-primary)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="var(--color-warning-500)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
