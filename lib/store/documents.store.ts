import { createEntityStore } from "./createStore";

export interface DocFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  fileType?: string | null;
  documentType: string;
  description?: string | null;
  isPrivate: boolean;
  createdAt: string;
  client?: { companyName: string } | null;
  project?: { name: string } | null;
  employee?: { firstName: string; lastName: string } | null;
  invoice?: { invoiceNumber: string } | null;
}

export const useDocumentsStore = createEntityStore<DocFile[]>("/api/documents?tab=all&limit=500");
