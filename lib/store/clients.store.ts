import { createEntityStore } from "./createStore";
import type { ClientStatus } from "@prisma/client";

export interface ClientSummary {
  id: string;
  clientId: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  currency: string;
  status: ClientStatus;
  startDate: string | null;
  createdAt: string;
  _count: { projects: number; invoices: number };
}

export interface ClientsData {
  clients: ClientSummary[];
  total: number;
  pages: number;
  page: number;
}

export const useClientsStore = createEntityStore<ClientsData>("/api/clients?limit=200");
