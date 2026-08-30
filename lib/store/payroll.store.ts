import { createEntityStore } from "./createStore";

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  paidAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  _count: { items: number };
  totalNet: number;
  totalGross: number;
}

export const usePayrollStore = createEntityStore<PayrollRun[]>("/api/payroll");
