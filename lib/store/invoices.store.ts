import { createEntityStore } from "./createStore";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  total: number | string;
  balanceDue: number | string;
  issueDate: string;
  dueDate: string;
  sentAt?: string | null;
  paidAt?: string | null;
  client: { id: string; companyName: string };
  _count: { items: number; payments: number };
}

export const useInvoicesStore = createEntityStore<Invoice[]>("/api/invoices?limit=500");
