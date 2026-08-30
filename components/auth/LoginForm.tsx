"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputLabel } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password. Please verify your credentials.",
  Configuration: "Server configuration error. Please contact the administrator.",
  AccessDenied: "Access denied. Your account is inactive or unauthorized.",
  Default: "Authentication failed. Please check your credentials and try again.",
};

interface LoginFormProps {
  callbackUrl?: string;
  error?: string;
}

export function LoginForm({ callbackUrl = "/dashboard", error: serverError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [error, setError] = useState<string | null>(
    serverError ? (ERROR_MESSAGES[serverError] ?? ERROR_MESSAGES.Default) : null
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.Default);
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(ERROR_MESSAGES.Default);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-danger-50)] border border-[var(--color-danger-100)] p-3 text-sm text-[var(--text-danger)] animate-in fade-in duration-200">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-medium leading-relaxed">{error}</div>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <InputLabel htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Work Email
        </InputLabel>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Mail size={16} />
          </div>
          <input
            id="email"
            type="email"
            placeholder="name@amzetix.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            className={cn(
              "w-full h-10 pl-9 pr-3.5 text-sm rounded-[var(--radius-md)]",
              "bg-[var(--surface-input)] text-[var(--text-primary)]",
              "border border-[var(--border-input)] transition-all duration-[var(--transition-fast)]",
              "placeholder:text-[var(--text-tertiary)]",
              "focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <InputLabel htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Password
        </InputLabel>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Lock size={16} />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyDown}
            required
            autoComplete="current-password"
            className={cn(
              "w-full h-10 pl-9 pr-10 text-sm rounded-[var(--radius-md)]",
              "bg-[var(--surface-input)] text-[var(--text-primary)]",
              "border border-[var(--border-input)] transition-all duration-[var(--transition-fast)]",
              "placeholder:text-[var(--text-tertiary)]",
              "focus:outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {capsLockActive && (
          <p className="text-[11px] text-[var(--color-warning-600)] font-medium mt-1">
            Caps Lock is ON
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full h-10 text-sm font-semibold tracking-wide justify-center gap-2 group cursor-pointer"
          loading={loading}
        >
          {!loading && <span>Sign In to Workspace</span>}
          {!loading && <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </div>
    </form>
  );
}
