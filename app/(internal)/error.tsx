"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InternalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div
        className="h-14 w-14 rounded-full flex items-center justify-center"
        style={{ background: "var(--color-danger-50)", color: "var(--color-danger-500)" }}
      >
        <AlertTriangle size={24} />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Something went wrong
        </h2>
        <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
