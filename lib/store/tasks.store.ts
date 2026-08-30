import { createEntityStore } from "./createStore";
import type { TaskStatus, TaskPriority } from "@prisma/client";

export interface TaskSummary {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  estimatedHours: number | null;
  tags: string[];
  project: { id: string; projectId: string; name: string } | null;
  assignee: { id: string; firstName: string; lastName: string; profileImage: string | null } | null;
  checklists?: { done: boolean }[];
  _count?: { checklists: number; comments: number; attachments?: number };
  createdAt: string;
  updatedAt: string;
}

export interface TasksData {
  tasks: TaskSummary[];
  total: number;
  pages: number;
  page: number;
}

export const useTasksStore = createEntityStore<TasksData>("/api/tasks?limit=200");
