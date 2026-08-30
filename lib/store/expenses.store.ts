import { createEntityStore } from "./createStore";

export interface Expense {
  id: string;
  expenseId: string;
  date: string;
  vendor?: string | null;
  description: string;
  category: string;
  amount: number | string;
  currency: string;
  method?: string | null;
  status: string;
  notes?: string | null;
  client?: { id: string; companyName: string } | null;
}

export const useExpensesStore = createEntityStore<Expense[]>("/api/expenses?limit=500");
