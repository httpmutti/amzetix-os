import { create } from "zustand";
import type { FetchStatus } from "./createStore";

export interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  isManual: boolean;
  project: { id: string; name: string; projectId: string } | null;
  task: { id: string; title: string; taskId: string } | null;
  employee: { id: string; firstName: string; lastName: string };
}

interface TimeState {
  entries: TimeEntry[];
  active: TimeEntry | null;
  status: FetchStatus;
  fetchedAt: number | null;
  error: string | null;
  fetch: () => Promise<void>;
  invalidate: () => void;
  setActive: (entry: TimeEntry | null) => void;
  mutateEntries: (updater: (entries: TimeEntry[]) => TimeEntry[]) => void;
}

const TTL = 5 * 60 * 1000;

export const useTimeStore = create<TimeState>((set, get) => ({
  entries: [],
  active: null,
  status: "idle",
  fetchedAt: null,
  error: null,

  async fetch() {
    const { fetchedAt, status } = get();
    if ((fetchedAt && Date.now() - fetchedAt < TTL) || status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const [entriesRes, activeRes] = await Promise.all([
        fetch("/api/time"),
        fetch("/api/time/active"),
      ]);
      const [entriesJson, activeJson] = await Promise.all([entriesRes.json(), activeRes.json()]);
      set({
        entries: entriesJson.data ?? [],
        active: activeJson.data ?? null,
        status: "success",
        fetchedAt: Date.now(),
      });
    } catch (err) {
      set({ status: "error", error: (err as Error).message });
    }
  },

  invalidate() {
    set({ fetchedAt: null });
  },

  setActive(entry) {
    set({ active: entry });
  },

  mutateEntries(updater) {
    set((s) => ({ entries: updater(s.entries) }));
  },
}));
