import { createEntityStore } from "./createStore";

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number | string;
  paidAt: string;
  method: string;
  referenceId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface LoanAccount {
  id: string;
  loanNumber: string;
  source: string;
  principal: number | string;
  currency: string;
  interestRate?: number | string | null;
  startDate: string;
  dueDate?: string | null;
  purpose?: string | null;
  status: "ACTIVE" | "FULLY_REPAID" | "ON_HOLD" | "DEFAULTED";
  notes?: string | null;
  createdAt: string;
  repayments: LoanRepayment[];
  totalRepaid: number;
  outstanding: number;
}

interface LedgerData {
  loans: LoanAccount[];
  totalDebt: number;
  totalRepaidAll: number;
}

export const useLedgerStore = createEntityStore<LedgerData>("/api/ledger");
