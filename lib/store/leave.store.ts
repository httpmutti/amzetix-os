import { create } from "zustand";
import type { FetchStatus } from "./createStore";

export interface LeaveType {
  id: string;
  name: string;
  daysAllowed: number;
  isPaid: boolean;
}

export interface LeaveBalance {
  id: string;
  allocated: number;
  used: number;
  remaining: number;
  leaveType: LeaveType;
}

export interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string | null;
  rejectionNote?: string | null;
  leaveType: LeaveType;
  employee: { id: string; firstName: string; lastName: string; position?: string | null };
  createdAt: string;
}

interface LeaveData {
  types: LeaveType[];
  balances: LeaveBalance[];
  myRequests: LeaveRequest[];
}

interface LeaveState extends LeaveData {
  status: FetchStatus;
  fetchedAt: number | null;
  error: string | null;
  allRequests: LeaveRequest[];
  allStatus: FetchStatus;
  fetch: () => Promise<void>;
  fetchAll: () => Promise<void>;
  invalidate: () => void;
  mutateMyRequests: (updater: (reqs: LeaveRequest[]) => LeaveRequest[]) => void;
  mutateAllRequests: (updater: (reqs: LeaveRequest[]) => LeaveRequest[]) => void;
}

const TTL = 5 * 60 * 1000;

export const useLeaveStore = create<LeaveState>((set, get) => ({
  types: [],
  balances: [],
  myRequests: [],
  allRequests: [],
  status: "idle",
  allStatus: "idle",
  fetchedAt: null,
  error: null,

  async fetch() {
    const { fetchedAt, status } = get();
    if ((fetchedAt && Date.now() - fetchedAt < TTL) || status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const [typesRes, balRes, myRes] = await Promise.all([
        fetch("/api/leave-types"),
        fetch("/api/leave-balance"),
        fetch("/api/leave?limit=50"),
      ]);
      const [typesJson, balJson, myJson] = await Promise.all([typesRes.json(), balRes.json(), myRes.json()]);
      set({
        types: typesJson.data ?? [],
        balances: balJson.data ?? [],
        myRequests: myJson.data ?? [],
        status: "success",
        fetchedAt: Date.now(),
      });
    } catch (err) {
      set({ status: "error", error: (err as Error).message });
    }
  },

  async fetchAll() {
    const { allStatus } = get();
    if (allStatus === "loading") return;
    set({ allStatus: "loading" });
    try {
      const res = await fetch("/api/leave?status=PENDING&limit=100");
      const json = await res.json();
      set({ allRequests: json.data ?? [], allStatus: "success" });
    } catch {
      set({ allStatus: "error" });
    }
  },

  invalidate() {
    set({ fetchedAt: null });
  },

  mutateMyRequests(updater) {
    set((s) => ({ myRequests: updater(s.myRequests) }));
  },

  mutateAllRequests(updater) {
    set((s) => ({ allRequests: updater(s.allRequests) }));
  },
}));
