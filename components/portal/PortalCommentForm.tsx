"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface Props {
  projectId: string;
  initialComments: Comment[];
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PortalCommentForm({ projectId, initialComments }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/portal/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId, content: text.trim() }),
      });
      let json: { error?: string; data?: Comment & { createdAt?: string } } = {};
      try { json = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) {
        toast.error(json.error ?? `Error ${res.status}`);
        return;
      }
      if (json.data) {
        setComments(prev => [
          ...prev,
          { ...json.data!, createdAt: json.data!.createdAt ?? new Date().toISOString() },
        ]);
      }
      setText("");
      toast.success("Message sent");
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm py-2" style={{ color: "var(--text-secondary)" }}>
          No messages yet. Send a message below and the team will respond shortly.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              {/* Avatar */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ background: "var(--color-neutral-200)", color: "var(--text-secondary)" }}
              >
                {initials(c.user.name)}
              </div>
              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {c.user.name ?? "Team"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {formatTs(c.createdAt)}
                  </span>
                </div>
                <div
                  className="rounded-[var(--radius-lg)] rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap"
                  style={{
                    background: "var(--surface-page)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {c.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <form onSubmit={submit} className="mt-4">
        <div
          className="flex gap-3 items-end rounded-[var(--radius-lg)] border px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-[var(--border-focus)]"
          style={{ background: "var(--input-bg)", borderColor: "var(--input-border)" }}
        >
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (text.trim() && !loading) submit(e as unknown as React.FormEvent);
              }
            }}
            rows={2}
            placeholder="Write a message… (⌘↵ to send)"
            className="flex-1 resize-none outline-none text-sm bg-transparent"
            style={{ color: "var(--text-primary)" }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading || !text.trim()}
            loading={loading}
            icon={<Send size={13} />}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
