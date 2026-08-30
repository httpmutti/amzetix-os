import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  Lock,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "CLIENT") redirect("/portal");
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--surface-page)] text-[var(--text-primary)] overflow-hidden">
      {/* ────────────────────────────────────────────────────────────
          SHARED FULL-WIDTH HEADER
         ──────────────────────────────────────────────────────────── */}
      <header className="h-[64px] w-full bg-[var(--surface-sidebar)] border-b border-[var(--border-default)] px-6 sm:px-8 xl:px-12 flex items-center justify-between shrink-0 z-20 select-none">
        <div className="flex items-center gap-3">
          <Logo size="md" href="/login" />
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-200)] text-[var(--text-secondary)] border border-[var(--border-default)]">
            Tech & Marketing
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden md:inline-flex text-xs font-mono text-[var(--text-tertiary)] tracking-wider">
            v2.4 Enterprise
          </span>
          <div className="h-4 w-[1px] bg-[var(--border-default)] hidden md:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────
          SPLIT BODY (Straight clean full vertical division)
         ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Enterprise Showcase */}
        <aside className="hidden lg:flex lg:w-1/2 xl:w-[58%] relative flex-col justify-center px-10 xl:px-16 overflow-hidden bg-[var(--surface-sidebar)] border-r border-[var(--border-default)] select-none">
          {/* Subtle grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(var(--text-primary) 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />

          {/* Ambient background glows */}
          <div
            className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 dark:opacity-15"
            style={{
              background: "radial-gradient(circle, var(--color-neutral-400), transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-15 dark:opacity-10"
            style={{
              background: "radial-gradient(circle, var(--color-neutral-600), transparent 70%)",
            }}
          />

          {/* Center Main Copy & Features */}
          <div className="relative z-10 max-w-xl">
            {/* Headline */}
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-[1.2] text-[var(--text-primary)]">
              Powering high-impact{" "}
              <span className="text-[var(--text-secondary)] underline decoration-[var(--border-input)] decoration-2 underline-offset-4">
                Tech & Marketing
              </span>{" "}
              execution.
            </h1>

            <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              A centralized administrative platform for client deliverables, sprint velocity, financial tracking, automated payroll, and team operations.
            </p>

            {/* Bento Feature Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Tech Card */}
              <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-lg bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-200)] flex items-center justify-center text-[var(--text-primary)]">
                    <Cpu size={16} />
                  </div>
                  <ArrowUpRight size={14} className="text-[var(--text-tertiary)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Tech & Engineering
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Sprint boards, cloud files, task workflows & client portals.
                </p>
              </div>

              {/* Marketing Card */}
              <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-lg bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-200)] flex items-center justify-center text-[var(--text-primary)]">
                    <TrendingUp size={16} />
                  </div>
                  <ArrowUpRight size={14} className="text-[var(--text-tertiary)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Marketing & Revenue
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Invoicing pipelines, client accounts & real-time revenue analytics.
                </p>
              </div>
            </div>

            {/* Metric Badges */}
            <div className="flex items-center gap-6 mt-6 pt-5 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[var(--color-success-500)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  99.99% Cloud SLA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-[var(--color-success-500)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  256-bit Encrypted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-[var(--color-success-500)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Multi-Tenant Vault
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: Clean Full-Height Column with Rounded Floating Form Box */}
        <main className="w-full lg:w-1/2 xl:w-[42%] relative flex flex-col justify-center px-6 sm:px-10 xl:px-14 bg-[var(--surface-page)] overflow-hidden">
          {/* Centered Login Card with smooth rounded borders */}
          <div className="w-full max-w-[390px] mx-auto rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Welcome back
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                Enter your authorized credentials to access your workspace
              </p>
            </div>

            {/* Form */}
            <LoginForm callbackUrl={params.callbackUrl} error={params.error} />

            {/* Security footnote */}
            <div className="mt-5 pt-4 border-t border-[var(--border-default)] flex items-center justify-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <Lock size={12} className="text-[var(--text-tertiary)]" />
              <span>TLS 1.3 end-to-end encrypted</span>
            </div>
          </div>
        </main>
      </div>

      {/* ────────────────────────────────────────────────────────────
          SHARED FULL-WIDTH FOOTER
         ──────────────────────────────────────────────────────────── */}
      <footer className="h-[48px] w-full border-t border-[var(--border-default)] bg-[var(--surface-sidebar)] px-6 sm:px-8 xl:px-12 flex items-center justify-between shrink-0 z-20 text-xs text-[var(--text-tertiary)] select-none">
        <p>© {new Date().getFullYear()} AMZETIX Inc. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-success-500)] inline-block animate-pulse" />
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">Production Node Active</span>
        </div>
      </footer>
    </div>
  );
}
