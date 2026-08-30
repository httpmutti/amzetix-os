import { createEntityStore } from "./createStore";
import type { LeadStatus, Service } from "@prisma/client";

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  website: string | null;
  service: Service | null;
  estimatedValue: number | null;
  currency: string;
  source: string | null;
  assignedToId: string | null;
  status: LeadStatus;
  notes: string | null;
  lastContactDate: string | null;
  nextFollowUp: string | null;
  convertedAt: string | null;
  clientId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CRMData {
  leads: Lead[];
  total: number;
  pages: number;
  page: number;
}

export const useCRMStore = createEntityStore<CRMData>("/api/crm?limit=200");
