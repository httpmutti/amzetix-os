import { createEntityStore } from "./createStore";

export interface Payment {
  id: string;
  paymentNumber: string;
  amount: number | string;
  currency: string;
  paymentDate: string;
  method: string;
  referenceId?: string | null;
  client: { id: string; companyName: string };
  invoice: { id: string; invoiceNumber: string };
}

export const usePaymentsStore = createEntityStore<Payment[]>("/api/payments?limit=500");
