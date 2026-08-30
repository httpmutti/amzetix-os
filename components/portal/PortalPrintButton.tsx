"use client";

export function PortalPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors print:hidden cursor-pointer"
      style={{ borderColor: "var(--border-default)", color: "var(--text-primary)", background: "var(--surface-card)" }}
    >
      Print / Save PDF
    </button>
  );
}
