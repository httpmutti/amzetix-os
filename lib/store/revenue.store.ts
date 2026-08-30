import { create } from "zustand";
import type { FetchStatus } from "./createStore";

export interface MonthlyStat { month: number; revenue: number; expenses: number; payroll: number }
export interface CategoryStat { category: string; total: number }
export interface Withdrawal { id: string; date: string; amount: number | string; currency: string; description?: string | null; method: string }
export interface RevenueSummary {
  totalRevenue: number; totalExpenses: number; totalPayroll: number; totalCosts: number; netProfit: number; totalWithdrawals: number;
}
export interface RevenueData {
  year: number;
  summary: RevenueSummary;
  monthly: MonthlyStat[];
  expenseByCategory: CategoryStat[];
  withdrawals: Withdrawal[];
}

interface RevenueState {
  cache: Record<string, { data: RevenueData; fetchedAt: number }>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  loadYear: (year: string) => Promise<void>;
  getYear: (year: string) => RevenueData | null;
  invalidateYear: (year: string) => void;
}

const TTL = 5 * 60 * 1000;

export const useRevenueStore = create<RevenueState>((set, get) => ({
  cache: {},
  loading: {},
  error: {},

  getYear(year) {
    const entry = get().cache[year];
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > TTL) return null;
    return entry.data;
  },

  async loadYear(year) {
    const { cache, loading } = get();
    const entry = cache[year];
    if ((entry && Date.now() - entry.fetchedAt < TTL) || loading[year]) return;
    set((s) => ({ loading: { ...s.loading, [year]: true }, error: { ...s.error, [year]: null } }));
    try {
      const res = await fetch(`/api/revenue/summary?year=${year}`);
      const json = await res.json();
      set((s) => ({
        cache: { ...s.cache, [year]: { data: json.data, fetchedAt: Date.now() } },
        loading: { ...s.loading, [year]: false },
      }));
    } catch (err) {
      set((s) => ({
        loading: { ...s.loading, [year]: false },
        error: { ...s.error, [year]: (err as Error).message },
      }));
    }
  },

  invalidateYear(year) {
    set((s) => {
      const next = { ...s.cache };
      delete next[year];
      return { cache: next };
    });
  },
}));
