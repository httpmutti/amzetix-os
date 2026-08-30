"use client";

import { useState, useEffect, useCallback } from "react";
import { Monitor, Smartphone, RefreshCw, Mail, ExternalLink, Loader2, Send, CheckCircle, AlertCircle, Sun, Moon, FileText } from "lucide-react";

const TEMPLATES = [
  { id: "invoice-sent",      label: "Invoice Sent",      icon: "📄", desc: "Sent to client when invoice is dispatched",  hasPdf: true },
  { id: "portal-invite",     label: "Portal Invite",     icon: "🔑", desc: "Sent to client user with login credentials", hasPdf: false },
  { id: "payslip",           label: "Payslip",           icon: "💰", desc: "Monthly payslip sent to employee",           hasPdf: true },
  { id: "leave-request",     label: "Leave Request",     icon: "📅", desc: "Sent to HR when employee submits leave",     hasPdf: false },
  { id: "leave-approved",    label: "Leave Approved",    icon: "✅", desc: "Sent to employee when leave is approved",    hasPdf: false },
  { id: "leave-rejected",    label: "Leave Rejected",    icon: "❌", desc: "Sent to employee when leave is rejected",    hasPdf: false },
  { id: "task-assigned",     label: "Task Assigned",     icon: "🎯", desc: "Sent to employee when a task is assigned",   hasPdf: false },
  { id: "welcome-employee",  label: "Welcome Employee",  icon: "👋", desc: "Onboarding email sent to new hire",          hasPdf: false },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];
type Device = "desktop" | "mobile";
type ViewMode = "email" | "pdf";

export default function EmailPreviewPage() {
  const [active, setActive] = useState<TemplateId>("invoice-sent");
  const [device, setDevice] = useState<Device>("desktop");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<ViewMode>("email");
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "ok" | "error">("idle");
  const [sendMsg, setSendMsg] = useState("");

  const loadTemplate = useCallback(async (id: TemplateId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dev/email-preview/${id}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const text = await res.text();
      setHtml(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load template");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate(active);
  }, [active, refreshKey, loadTemplate]);

  const currentTemplate = TEMPLATES.find((t) => t.id === active)!;
  const refresh = () => setRefreshKey((k) => k + 1);
  const openRaw = () => window.open(`/api/dev/email-preview/${active}`, "_blank");
  const openRawPdf = () => window.open(`/api/dev/pdf-preview/${active}`, "_blank");

  const switchTemplate = (id: TemplateId) => {
    setActive(id);
    const tpl = TEMPLATES.find((t) => t.id === id)!;
    if (!tpl.hasPdf) setViewMode("email");
  };

  // Force dark-mode styles in the iframe by replacing the conditional media query with @media all
  const previewHtml = theme === "dark"
    ? html.replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/g, "@media all {")
    : html;

  const sendTest = async () => {
    setSending(true);
    setSendState("idle");
    setSendMsg("");
    try {
      const res = await fetch("/api/dev/email-preview/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Send failed");
      setSendState("ok");
      setSendMsg(`Sent to ${json.sentTo}`);
    } catch (e) {
      setSendState("error");
      setSendMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
      setTimeout(() => { setSendState("idle"); setSendMsg(""); }, 5000);
    }
  };

  return (
    <div className="flex h-dvh bg-[var(--surface-page)] overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--surface-card)] overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Email Templates</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Dev preview only</p>
        </div>

        <nav className="flex-1 px-2 pb-4 space-y-0.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTemplate(t.id)}
              className={[
                "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                active === t.id
                  ? "bg-[var(--accent)] text-white"
                  : "hover:bg-[var(--surface-hover)] text-[var(--text-primary)]",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{t.icon}</span>
                <span className="text-xs font-medium leading-tight">{t.label}</span>
              </div>
              <p className={[
                "text-[11px] mt-0.5 leading-tight pl-6",
                active === t.id ? "text-indigo-100" : "text-[var(--text-muted)]",
              ].join(" ")}>
                {t.desc}
              </p>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-card)] shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
              {currentTemplate.icon} {currentTemplate.label}
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{currentTemplate.desc}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Email / PDF view toggle — hidden via CSS when template has no PDF attachment */}
            <div
              className="flex rounded-lg border border-[var(--border)] overflow-hidden"
              style={{ display: currentTemplate.hasPdf ? "flex" : "none" }}
            >
              <button
                onClick={() => setViewMode("email")}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  viewMode === "email"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <button
                onClick={() => setViewMode("pdf")}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-[var(--border)]",
                  viewMode === "pdf"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <FileText className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>

            {/* Device toggle */}
            <div
              className="flex rounded-lg border border-[var(--border)] overflow-hidden"
              style={{ display: viewMode === "email" ? "flex" : "none" }}
            >
              <button
                onClick={() => setDevice("desktop")}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  device === "desktop"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-[var(--border)]",
                  device === "mobile"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </button>
            </div>

            {/* Theme toggle */}
            <div
              className="flex rounded-lg border border-[var(--border)] overflow-hidden"
              style={{ display: viewMode === "email" ? "flex" : "none" }}
            >
              <button
                onClick={() => setTheme("light")}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                  theme === "light"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-[var(--border)]",
                  theme === "dark"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
            </div>

            <button
              onClick={refresh}
              style={{ display: viewMode === "email" ? "flex" : "none" }}
              className="items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>

            {/* Send test email — attaches PDF automatically for invoice/payslip */}
            <button
              onClick={sendTest}
              disabled={sending}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                sendState === "ok"
                  ? "bg-[var(--color-success-50)] border-[var(--color-success-500)] text-[var(--color-success-700)]"
                  : sendState === "error"
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-[var(--text-primary)] text-[var(--surface-card)] border-[var(--text-primary)] hover:opacity-90",
                sending ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : sendState === "ok" ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : sendState === "error" ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {sendState === "ok" ? sendMsg : sendState === "error" ? sendMsg : sending ? "Sending…" : "Send Test"}
            </button>

            <button
              onClick={viewMode === "pdf" ? openRawPdf : openRaw}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {viewMode === "pdf" ? "Open PDF" : "Raw HTML"}
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-[var(--surface-page)] p-6 flex items-start justify-center">
          {viewMode === "pdf" ? (
            /* ── PDF preview ── */
            <div className="w-full h-full flex flex-col" style={{ maxWidth: 800, minHeight: 700 }}>
              <div className="shrink-0 flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)]">PDF Attachment Preview — generated from sample data</span>
                <span className="ml-auto text-xs text-[var(--text-muted)] bg-[var(--surface-card)] border border-[var(--border)] rounded px-2 py-0.5">
                  Auto-attached when email is sent
                </span>
              </div>
              <iframe
                key={`pdf-${active}`}
                src={`/api/dev/pdf-preview/${active}`}
                title={`${currentTemplate.label} PDF`}
                className="flex-1 w-full rounded-xl border border-[var(--border)] shadow-lg"
                style={{ minHeight: 700 }}
              />
            </div>
          ) : (
            /* ── Email preview ── */
            <div
              className="transition-all duration-300 shadow-lg rounded-xl overflow-hidden border border-[var(--border)]"
              style={{ width: device === "mobile" ? 390 : "100%", maxWidth: device === "mobile" ? 390 : 800 }}
            >
              {/* Browser chrome */}
              <div className="bg-zinc-800 px-4 py-2.5 flex items-center gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                </div>
                <div className="flex-1 mx-3 bg-zinc-700 rounded-md px-3 py-1 text-xs text-zinc-400 font-mono truncate">
                  {active}.tsx
                  {currentTemplate.hasPdf && (
                    <span className="ml-2 text-zinc-500">· PDF attached</span>
                  )}
                </div>
                {loading && <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin shrink-0" />}
              </div>

              {/* Content */}
              {error ? (
                <div className="bg-white flex items-center justify-center p-12 text-center" style={{ minHeight: 400 }}>
                  <div>
                    <p className="text-red-500 font-medium text-sm mb-1">Failed to render template</p>
                    <p className="text-gray-400 text-xs font-mono">{error}</p>
                  </div>
                </div>
              ) : loading && !html ? (
                <div className="bg-white flex items-center justify-center" style={{ minHeight: 400 }}>
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
              ) : (
                <iframe
                  key={`${active}-${device}-${theme}`}
                  srcDoc={previewHtml}
                  title={currentTemplate.label}
                  className="w-full border-0 block"
                  style={{ height: device === "mobile" ? 700 : 720, backgroundColor: theme === "dark" ? "#0a0a0a" : "#f7f7f8" }}
                  sandbox="allow-same-origin"
                />
              )}
            </div>
          )}
        </div>

        {/* Bottom strip */}
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-card)] px-5 py-3">
          <p className="text-xs text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wide">All templates</p>
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTemplate(t.id)}
                className={[
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  active === t.id
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]",
                ].join(" ")}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
