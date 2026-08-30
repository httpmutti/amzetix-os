import { create } from "zustand";

export type FetchStatus = "idle" | "loading" | "success" | "error";

export interface SliceState<T> {
  data: T | null;
  status: FetchStatus;
  error: string | null;
  fetchedAt: number | null;
}

export interface SliceActions<T> {
  fetch: () => Promise<void>;
  invalidate: () => void;
  setData: (data: T) => void;
  mutate: (updater: (data: T) => T) => void;
}

export type Slice<T> = SliceState<T> & SliceActions<T>;

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Creates a typed Zustand store for a single API endpoint.
 * - fetch() is a no-op if data is fresh (< TTL).
 * - invalidate() clears fetchedAt so the next fetch() hits the API.
 * - setData() lets server-hydrated data be pushed in directly.
 */
export function createEntityStore<T>(
  apiPath: string,
  ttl = DEFAULT_TTL_MS
) {
  return create<Slice<T>>((set, get) => ({
    data: null,
    status: "idle",
    error: null,
    fetchedAt: null,

    async fetch() {
      const { fetchedAt, status } = get();
      const fresh = fetchedAt && Date.now() - fetchedAt < ttl;
      if (fresh || status === "loading") return;

      set({ status: "loading", error: null });
      try {
        const res = await fetch(apiPath);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        set({ data: json.data ?? json, status: "success", fetchedAt: Date.now() });
      } catch (err) {
        set({ status: "error", error: (err as Error).message });
      }
    },

    invalidate() {
      set({ fetchedAt: null });
    },

    setData(data: T) {
      set({ data, status: "success", fetchedAt: Date.now() });
    },

    mutate(updater: (data: T) => T) {
      const { data } = get();
      if (data === null) return;
      set({ data: updater(data) });
    },
  }));
}
