import { createEntityStore } from "./createStore";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export const useNotificationsStore = createEntityStore<AppNotification[]>("/api/notifications?limit=100");
