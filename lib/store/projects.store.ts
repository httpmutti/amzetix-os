import { createEntityStore } from "./createStore";
import type { ProjectStatus, ProjectPriority } from "@prisma/client";

export interface ProjectSummary {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  dueDate: string | null;
  startDate: string | null;
  budget: number | null;
  currency: string;
  estimatedHours: number | null;
  client: { id: string; companyName: string } | null;
  tasks: { status: string }[];
  _count: { tasks: number; members: number; timeEntries: number };
  createdAt: string;
}

export interface ProjectsData {
  projects: ProjectSummary[];
  total: number;
  pages: number;
  page: number;
}

export const useProjectsStore = createEntityStore<ProjectsData>("/api/projects?limit=100");
