"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { Input, InputLabel } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveStore } from "@/lib/store/leave.store";

const PAGE_SIZE = 10;

const LEAVE_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  APPROVED: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  REJECTED: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)]",
  CANCELLED: "bg-[var(--status-paused-bg)] text-[var(--status-paused-text)]",
};

interface Props {
  canViewAll: boolean;
  canApprove: boolean;
}

export function LeaveContent({ canViewAll, canApprove }: Props) {
  const { types, balances, myRequests, allRequests, status, allStatus, fetch, fetchAll, mutateMyRequests, mutateAllRequests } = useLeaveStore();
  const [activeTab, setActiveTab] = useState(canViewAll ? "all" : "my");
  const [requestOpen, setRequestOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [myPage, setMyPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { if (canViewAll) fetchAll(); }, [canViewAll, fetchAll]);

  const loading = status === "idle" || status === "loading";

  const myTotalPages = Math.ceil(myRequests.length / PAGE_SIZE);
  const myPaged = myRequests.slice((myPage - 1) * PAGE_SIZE, myPage * PAGE_SIZE);
  const allTotalPages = Math.ceil(allRequests.length / PAGE_SIZE);
  const allPaged = allRequests.slice((allPage - 1) * PAGE_SIZE, allPage * PAGE_SIZE);

  const leaveTypeOptions = [{ value: "", label: "Select leave type" }, ...types.map(t => ({ value: t.id, label: `${t.name} (${t.isPaid ? "Paid" : "Unpaid"})` }))];

  const TABS = [
    ...(!canViewAll ? [{ id: "my", label: "My Leave" }] : []),
    ...(canViewAll ? [{ id: "all", label: "All Requests", count: allRequests.length }] : []),
  ];

  const handleSubmit = async () => {
    if (!leaveTypeId || !startDate || !endDate) { toast.error("Please fill all required fields"); return; }
    setSubmitting(true);
    const res = await window.fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveTypeId, startDate, endDate, reason: reason || undefined }),
    });
    const json = await res.json();
    if (res.ok) {
      toast.success("Leave request submitted");
      setRequestOpen(false);
      setLeaveTypeId(""); setStartDate(""); setEndDate(""); setReason("");
      const created = json.data ?? json;
      mutateMyRequests((list) => [created, ...list]);
    } else {
      toast.error(json.error ?? "Failed to submit");
    }
    setSubmitting(false);
  };

  const handleApprove = async (id: string) => {
    const res = await window.fetch(`/api/leave/${id}/approve`, { method: "POST" });
    if (res.ok) {
      toast.success("Leave approved");
      mutateAllRequests((list) => list.map((r) => r.id === id ? { ...r, status: "APPROVED" } : r));
      mutateMyRequests((list) => list.map((r) => r.id === id ? { ...r, status: "APPROVED" } : r));
    } else {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!rejectOpen) return;
    const res = await window.fetch(`/api/leave/${rejectOpen}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: rejectNote }),
    });
    if (res.ok) {
      toast.success("Leave rejected");
      const id = rejectOpen;
      setRejectOpen(null);
      setRejectNote("");
      mutateAllRequests((list) => list.map((r) => r.id === id ? { ...r, status: "REJECTED", rejectionNote: rejectNote } : r));
      mutateMyRequests((list) => list.map((r) => r.id === id ? { ...r, status: "REJECTED" } : r));
    } else {
      toast.error("Failed to reject");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this leave request?")) return;
    const res = await window.fetch(`/api/leave/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Request cancelled");
      mutateMyRequests((list) => list.filter((r) => r.id !== id));
    } else {
      toast.error("Cannot cancel this request");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {balances.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {balances.map((b) => (
            <div key={b.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">{b.leaveType.name}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {b.remaining}
                <span className="text-sm font-normal text-[var(--text-secondary)]"> / {b.allocated} days</span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-[var(--interactive-primary-bg)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--interactive-primary)] transition-all" style={{ width: `${b.allocated > 0 ? Math.round((b.remaining / b.allocated) * 100) : 0}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{b.used} used</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        <Button size="sm" onClick={() => setRequestOpen(true)}><Plus size={14} /> Request Leave</Button>
      </div>

      {activeTab === "my" && (
        loading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : myRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] py-16">
            <p className="text-sm text-[var(--text-secondary)]">No leave requests yet</p>
            <Button size="sm" onClick={() => setRequestOpen(true)}><Plus size={14} /> Request Leave</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                    {["Type","Dates","Days","Reason","Status",""].map((h, i) => (
                      <th key={i} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myPaged.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0">
                      <td className="px-4 py-2.5 text-[var(--text-primary)] font-medium">{r.leaveType.name}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                        {format(new Date(r.startDate), "MMM d")} – {format(new Date(r.endDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.days}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)] max-w-[180px] truncate">{r.reason ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${LEAVE_STATUS_STYLES[r.status] ?? ""}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {r.status === "PENDING" && (
                          <button type="button" onClick={() => handleCancel(r.id)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--status-cancelled-text)] cursor-pointer">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={myPage} totalPages={myTotalPages} total={myRequests.length} pageSize={PAGE_SIZE} onPageChange={setMyPage} />
          </div>
        )
      )}

      {activeTab === "all" && canViewAll && (
        allRequests.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--text-secondary)]">No pending leave requests.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-default)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                    {["Employee","Type","Dates","Days","Reason","Status",""].map((h, i) => (
                      <th key={i} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPaged.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border-default)] bg-[var(--surface-card)] last:border-0">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-[var(--text-primary)]">{r.employee.firstName} {r.employee.lastName}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{r.employee.position ?? ""}</p>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.leaveType.name}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                        {format(new Date(r.startDate), "MMM d")} – {format(new Date(r.endDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{r.days}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)] max-w-[160px] truncate">{r.reason ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${LEAVE_STATUS_STYLES[r.status] ?? ""}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {canApprove && r.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => handleApprove(r.id)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--status-active-text)] hover:bg-[var(--status-active-bg)] transition-colors" title="Approve">
                              <Check size={13} />
                            </button>
                            <button type="button" onClick={() => { setRejectOpen(r.id); setRejectNote(""); }} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--status-cancelled-text)] hover:bg-[var(--status-cancelled-bg)] transition-colors" title="Reject">
                              <X size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={allPage} totalPages={allTotalPages} total={allRequests.length} pageSize={PAGE_SIZE} onPageChange={setAllPage} />
          </div>
        )
      )}

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request Leave">
        <div className="flex flex-col gap-4">
          <div>
            <InputLabel>Leave Type</InputLabel>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId} options={leaveTypeOptions} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputLabel>Start Date</InputLabel>
              <DateInput value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <InputLabel>End Date</InputLabel>
              <DateInput value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
            </div>
          </div>
          <div>
            <InputLabel>Reason (optional)</InputLabel>
            <Input placeholder="Brief reason for leave" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit Request</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!rejectOpen} onClose={() => setRejectOpen(null)} title="Reject Leave Request">
        <div className="flex flex-col gap-4">
          <div>
            <InputLabel>Rejection Note (optional)</InputLabel>
            <Input placeholder="Reason for rejection" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => setRejectOpen(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
