"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Upload, Trash2, Download, FileText, Image, File, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentsStore } from "@/lib/store/documents.store";
import type { DocFile } from "@/lib/store/documents.store";

const TABS = [
  { id: "all", label: "All" },
  { id: "client", label: "Clients" },
  { id: "project", label: "Projects" },
  { id: "employee", label: "Employees" },
  { id: "invoice", label: "Invoices" },
];

const DOC_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "CONTRACT", label: "Contract" },
  { value: "AGREEMENT", label: "Agreement" },
  { value: "ID_DOCUMENT", label: "ID Document" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "INVOICE", label: "Invoice" },
  { value: "PROJECT_FILE", label: "Project File" },
  { value: "BRAND_ASSET", label: "Brand Asset" },
  { value: "OTHER", label: "Other" },
];

const DOC_TYPE_UPLOAD_OPTIONS = DOC_TYPE_OPTIONS.slice(1);

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileIcon({ type }: { type?: string | null }) {
  if (!type) return <File size={20} className="text-[var(--text-tertiary)]" />;
  if (type.startsWith("image/")) return <Image size={20} className="text-[var(--color-info-400)]" />;
  if (type === "application/pdf") return <FileText size={20} className="text-[var(--color-danger-500)]" />;
  return <File size={20} className="text-[var(--text-tertiary)]" />;
}

function entityLabel(doc: DocFile): string {
  if (doc.client) return doc.client.companyName;
  if (doc.project) return doc.project.name;
  if (doc.employee) return `${doc.employee.firstName} ${doc.employee.lastName}`;
  if (doc.invoice) return doc.invoice.invoiceNumber;
  return "—";
}

interface Props { canUpload: boolean; canDelete: boolean }

export function DocumentsContent({ canUpload, canDelete }: Props) {
  const { data, status, fetch, invalidate, mutate } = useDocumentsStore();
  const [tab, setTab] = useState("all");
  const [docType, setDocType] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("OTHER");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const loading = status === "idle" || status === "loading";

  const docs = useMemo(() => {
    const all = data ?? [];
    return all.filter((doc) => {
      if (tab === "client" && !doc.client) return false;
      if (tab === "project" && !doc.project) return false;
      if (tab === "employee" && !doc.employee) return false;
      if (tab === "invoice" && !doc.invoice) return false;
      if (docType && doc.documentType !== docType) return false;
      return true;
    });
  }, [data, tab, docType]);

  const handleDelete = async (doc: DocFile) => {
    if (!confirm(`Delete "${doc.fileName}"?`)) return;
    const res = await window.fetch(`/api/documents?id=${doc.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Document deleted");
      mutate((list) => list.filter((d) => d.id !== doc.id));
    } else {
      toast.error("Failed to delete");
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("documentType", uploadType);
    if (uploadDesc) fd.append("description", uploadDesc);
    const res = await window.fetch("/api/documents/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (res.ok) {
      toast.success("File uploaded");
      setUploadOpen(false);
      setUploadFile(null);
      setUploadDesc("");
      setUploadType("OTHER");
      invalidate();
      fetch();
    } else {
      toast.error(json.error ?? "Upload failed");
    }
    setUploading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setUploadFile(file); setUploadOpen(true); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Select value={docType} onValueChange={setDocType} options={DOC_TYPE_OPTIONS} />
        </div>
        <div className="flex-1" />
        {canUpload && (
          <Button size="sm" onClick={() => setUploadOpen(true)}><Upload size={14} /> Upload File</Button>
        )}
      </div>

      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer -mb-px ${
              tab === t.id
                ? "border-[var(--interactive-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`min-h-[200px] rounded-[var(--radius-lg)] transition-colors ${dragging ? "border-2 border-dashed border-[var(--interactive-primary)] bg-[var(--interactive-secondary)]" : ""}`}
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] py-16">
            <FolderOpen size={28} className="text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">No documents found</p>
            {canUpload && <p className="text-xs text-[var(--text-tertiary)]">Drag & drop a file or click Upload</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map(doc => (
              <div key={doc.id} className="group flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-3 hover:bg-[var(--interactive-secondary-hover)] transition-colors">
                <div className="mt-0.5 shrink-0"><FileIcon type={doc.fileType} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={doc.fileName}>{doc.fileName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="draft">{doc.documentType.replace(/_/g, " ")}</Badge>
                    {doc.isPrivate && <span className="text-[10px] text-[var(--text-tertiary)]">Private</span>}
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {entityLabel(doc)} · {formatBytes(doc.fileSize)} · {format(new Date(doc.createdAt), "MMM d, yyyy")}
                  </p>
                  {doc.description && <p className="text-[10px] text-[var(--text-secondary)] truncate">{doc.description}</p>}
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`/api/documents/${doc.id}/download`} className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--text-primary)] transition-colors" title="Download">
                    <Download size={13} />
                  </a>
                  {canDelete && (
                    <button type="button" onClick={() => handleDelete(doc)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--interactive-secondary-hover)] hover:text-[var(--color-danger-500)] transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={uploadOpen} onClose={() => { setUploadOpen(false); setUploadFile(null); }} title="Upload Document">
        <div className="flex flex-col gap-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed cursor-pointer py-8 transition-colors ${
              dragging ? "border-[var(--interactive-primary)] bg-[var(--interactive-secondary)]" : "border-[var(--border-default)] hover:border-[var(--border-focus)]"
            }`}
          >
            <Upload size={20} className="text-[var(--text-tertiary)]" />
            {uploadFile ? (
              <p className="text-sm font-medium text-[var(--text-primary)]">{uploadFile.name} <span className="text-[var(--text-tertiary)]">({formatBytes(uploadFile.size)})</span></p>
            ) : (
              <>
                <p className="text-sm text-[var(--text-secondary)]">Drop a file here or click to browse</p>
                <p className="text-xs text-[var(--text-tertiary)]">Max 20 MB</p>
              </>
            )}
            <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setUploadFile(f); }} />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Document Type</p>
            <Select value={uploadType} onValueChange={setUploadType} options={DOC_TYPE_UPLOAD_OPTIONS} />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description (optional)</p>
            <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} placeholder="Brief description…" className="w-full rounded-[var(--radius-md)] border border-[var(--border-input)] bg-[var(--surface-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--border-default)] pt-3">
            <Button variant="ghost" onClick={() => { setUploadOpen(false); setUploadFile(null); }}>Cancel</Button>
            <Button onClick={handleUpload} loading={uploading} disabled={!uploadFile}>Upload</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
