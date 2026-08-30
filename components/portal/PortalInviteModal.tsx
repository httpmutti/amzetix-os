"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  clientId: string;
}

export function PortalInviteModal({ clientId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; tempPassword?: string; note?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/portal/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, email, name }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to grant access"); return; }
      setResult(json.data);
      toast.success("Portal access granted");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setResult(null);
    setEmail("");
    setName("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
        style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
      >
        Invite to Portal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: "var(--surface-card)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Invite to Client Portal</h2>

            {result ? (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {result.note ?? "Portal access has been created."}
                </p>
                {result.tempPassword && (
                  <div className="rounded-xl p-4 border" style={{ background: "var(--surface-page)", borderColor: "var(--border-default)" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Temporary Password</p>
                    <code className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{result.tempPassword}</code>
                    <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                      Share this securely with <strong>{result.email}</strong>. They can change it after login.
                    </p>
                  </div>
                )}
                <button onClick={close} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "#fff" }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Contact Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="jane@company.com"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 py-2.5 rounded-lg text-sm border"
                    style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                  >
                    {loading ? "Granting…" : "Grant Access"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
