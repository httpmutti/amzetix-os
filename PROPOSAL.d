╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║   AGENCY OS — Full-Stack Digital Agency Management Platform                     ║
║   Proposal + Architecture + Phased Development Plan                              ║
║   Version: 1.0  |  Author: syedahmedfarooq496@gmail.com  |  Date: 2026-08-22   ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§0  DEEP AUDIT — CURRENT STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT EXISTS
───────────
  ✅ Next.js 15 (App Router) + TypeScript
  ✅ PostgreSQL + Prisma v7 — comprehensive schema (28+ models)
  ✅ NextAuth v5 (beta) — credential + Prisma adapter
  ✅ RBAC system — 8 roles, 50+ granular permissions
  ✅ Audit log model + service
  ✅ Notification model + API routes
  ✅ Most data-layer page files (stubs) — 20 routes created
  ✅ Some service layer (attendance, invoice, project, payroll…)
  ✅ Comprehensive Prisma schema (all entities modeled correctly)
  ✅ Client portal routing scaffold  (app/(portal))
  ✅ Some API routes (attendance, clients, notifications, settings)

WHAT IS BROKEN / MISSING
─────────────────────────
  ❌ Design system: shadcn/HSL vars (blue primary) — not token-based
  ❌ No styles/tokens.css — hex values and spacing hardcoded in components
  ❌ Dark mode uses .dark CSS class — must switch to [data-theme="dark"]
  ❌ No theme inline script — FOUC risk on every page load
  ❌ Sidebar uses bg-primary / text-muted-foreground (shadcn) — inconsistent
  ❌ Layout uses hardcoded p-6, bg-background — not responsive tokens
  ❌ No DashboardShell pattern — sidebar/main wired ad-hoc in layout.tsx
  ❌ No PageContainer component — pages set their own padding inconsistently
  ❌ No lib/nav.ts — nav config inline inside Sidebar.tsx
  ❌ No ThemeToggle component — dark mode not accessible from UI
  ❌ UI components are shadcn wrappers (not custom token-based)
  ❌ src/ directory structure — vape-os uses root app/, lib/, components/
  ❌ Tailwind v3 — vape-os runs Tailwind v4 (@tailwindcss/postcss)
  ❌ npm — vape-os uses pnpm
  ❌ Most pages are empty stubs or have incomplete implementations
  ❌ No file storage integration (documents module)
  ❌ No PDF generation (invoices)
  ❌ No email sending (invoice delivery, leave notifications)
  ❌ No time tracker (running timer, entries CRUD)
  ❌ Client portal is a blank stub
  ❌ No onboarding wizard for first-run setup
  ❌ No recurring invoice scheduler
  ❌ No payroll calculation engine


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§1  PRODUCT VISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agency OS is the operating layer for a digital agency — one place where an
owner or manager can see revenue, manage clients, run projects, track team
attendance, process payroll, and send invoices, without jumping between five
different SaaS tools.

TARGET USER
  Primary: Agency owner / founder
  Secondary: Admin, Project Manager, Accountant, HR
  Tertiary: Employee (limited view), Client (portal only)

CORE VALUE PROPS
  1. Single-screen financials — revenue vs expenses vs payroll at a glance
  2. Client-to-invoice pipeline — lead → client → project → invoice in one flow
  3. Team OS — attendance, leave, payroll all connected to the same employee record
  4. Client portal — client sees their projects, tasks, and invoices without Slack
  5. Full audit trail — every sensitive action is logged, exportable


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§2  PRODUCT DECISIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  DECISION 1 — SINGLE TENANT, MULTI-USER
    Agency OS runs as a single-org app — one PostgreSQL database per
    deployment, scoped to one agency. No SaaS multi-tenancy required.
    Rationale: simpler schema, no tenant isolation risk, easier to self-host.

  DECISION 2 — SERVER-FIRST DATA FETCHING
    Pages are Server Components by default (async page.tsx with direct Prisma
    calls). Client Components are used only for interactive UI: modals, forms,
    tables with filters. This mirrors the vape-os pattern exactly.

  DECISION 3 — NO SHADCN, CUSTOM UI
    All UI components are written from scratch using CSS custom properties
    (tokens). No Radix wrappers for aesthetic components. Rationale: full
    control over the visual system, no shadcn upgrade churn, consistent with
    vape-os.
    Exception: @radix-ui/react-dialog, @radix-ui/react-dropdown-menu and
    @radix-ui/react-select remain for their accessibility primitives only —
    wrapped in our own styled shell.

  DECISION 4 — MONOCHROME PALETTE (SAME AS VAPE-OS)
    Primary color = monochrome (titanium/silver/black). Status colors
    (success, warning, danger, info) are functional only.
    No brand blue, no colored sidebar.

  DECISION 5 — [data-theme="dark"] ATTRIBUTE SYSTEM
    Dark mode is toggled by setting data-theme="dark" on <html>.
    CSS overrides live in [data-theme="dark"] { } selector blocks inside
    tokens.css — identical to vape-os. NO .dark class, NO next-themes.

  DECISION 6 — FOLDER STRUCTURE MATCHES VAPE-OS
    Remove src/ wrapper. App lives at root level:
      app/       — Next.js App Router
      components/ — UI + layout components
      lib/       — utilities, auth, RBAC, theme, nav
      styles/    — tokens.css only
      services/  — business logic (moved from src/services/)
      prisma/    — schema + migrations + seed
      scripts/   — one-off utility scripts

  DECISION 7 — TAILWIND v4
    Upgrade Tailwind from v3 to v4 (@tailwindcss/postcss). globals.css uses
    @import "tailwindcss" instead of the three @tailwind directives.
    Inline tokens are referenced as bg-[var(--surface-card)] etc.

  DECISION 8 — NO PRISMA CHANGES IN PHASE 0-1
    The existing Prisma schema is production-quality. Do not change models
    during UI phases — only run migrations when adding net-new fields.

  DECISION 9 — PDF GENERATION: REACT-PDF / PUPPETEER ON SERVER
    Invoices rendered as PDF server-side with @react-pdf/renderer. No
    client-side PDF. Streamed as a download from an API route.

  DECISION 10 — EMAIL: RESEND
    Transactional emails (invoice delivery, leave approval, payroll slip) sent
    via Resend SDK. Template renders with react-email components.

  DECISION 11 — FILE STORAGE: LOCAL + S3-COMPATIBLE
    Documents stored on disk in dev (public/uploads) and on S3-compatible
    storage (e.g. Cloudflare R2) in production. One upload API route,
    adapter-swappable.

  DECISION 12 — TIME TRACKER: SERVER-PERSISTED TIMER
    Running timer state is stored in the database (TimeEntry.startTime,
    endTime=null). No client-side timer state. Page polls /api/time/active
    every 30s. Rationale: browser close doesn't lose time.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§3  ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOLDER STRUCTURE
────────────────
  agency-os/
  ├── app/
  │   ├── layout.tsx                      ← root layout, theme script inject
  │   ├── globals.css                     ← @import "tailwindcss" + @import tokens
  │   ├── icon.svg
  │   ├── (auth)/
  │   │   ├── layout.tsx
  │   │   └── login/
  │   │       ├── page.tsx
  │   │       └── LoginClient.tsx
  │   ├── (internal)/                     ← all staff-facing routes
  │   │   ├── layout.tsx                  ← DashboardShell + auth guard
  │   │   ├── dashboard/
  │   │   │   └── page.tsx
  │   │   ├── crm/
  │   │   │   ├── page.tsx
  │   │   │   └── CRMClient.tsx
  │   │   ├── clients/
  │   │   │   ├── page.tsx
  │   │   │   ├── ClientsClient.tsx
  │   │   │   └── [id]/
  │   │   │       ├── page.tsx
  │   │   │       └── ClientDetailClient.tsx
  │   │   ├── projects/
  │   │   │   ├── page.tsx
  │   │   │   ├── ProjectsClient.tsx
  │   │   │   └── [id]/
  │   │   │       ├── page.tsx
  │   │   │       └── ProjectDetailClient.tsx
  │   │   ├── tasks/
  │   │   ├── time/
  │   │   ├── team/
  │   │   ├── attendance/
  │   │   ├── leave/
  │   │   ├── payroll/
  │   │   ├── invoices/
  │   │   ├── payments/
  │   │   ├── expenses/
  │   │   ├── revenue/
  │   │   ├── reports/
  │   │   ├── documents/
  │   │   ├── notifications/
  │   │   ├── audit-logs/
  │   │   └── settings/
  │   ├── (portal)/                       ← client-facing portal
  │   │   ├── layout.tsx
  │   │   └── portal/
  │   │       ├── page.tsx
  │   │       ├── projects/
  │   │       ├── invoices/
  │   │       └── tickets/
  │   └── api/
  │       ├── auth/[...nextauth]/route.ts
  │       ├── clients/route.ts + [id]/route.ts
  │       ├── crm/route.ts + [id]/route.ts
  │       ├── projects/route.ts + [id]/route.ts
  │       ├── tasks/route.ts + [id]/route.ts
  │       ├── time/route.ts + active/route.ts
  │       ├── employees/route.ts + [id]/route.ts
  │       ├── attendance/route.ts + check-in/out/route.ts
  │       ├── leave/route.ts + [id]/route.ts
  │       ├── payroll/route.ts + [id]/route.ts
  │       ├── invoices/route.ts + [id]/route.ts + [id]/pdf/route.ts
  │       ├── payments/route.ts + [id]/route.ts
  │       ├── expenses/route.ts + [id]/route.ts
  │       ├── reports/route.ts
  │       ├── documents/route.ts + [id]/route.ts
  │       ├── notifications/route.ts
  │       ├── audit/route.ts
  │       └── settings/route.ts
  │
  ├── components/
  │   ├── layout/
  │   │   ├── DashboardShell.tsx          ← flex h-dvh shell, sidebar + main
  │   │   ├── Sidebar.tsx                 ← token-based, mobile-aware
  │   │   ├── Header.tsx                  ← top bar with breadcrumb + actions
  │   │   └── PageContainer.tsx           ← page-level padding + max-width
  │   ├── ui/
  │   │   ├── Button.tsx                  ← 5 variants, 4 sizes, loading state
  │   │   ├── Card.tsx                    ← surface-card, radius-lg, shadow-xs
  │   │   ├── Input.tsx                   ← label + error + icon slots
  │   │   ├── Select.tsx                  ← custom styled select
  │   │   ├── Modal.tsx                   ← Radix dialog wrapped in our shell
  │   │   ├── Badge.tsx                   ← status dots + text badges
  │   │   ├── Avatar.tsx                  ← initials fallback
  │   │   ├── Dropdown.tsx                ← Radix dropdown-menu shell
  │   │   ├── Tabs.tsx                    ← token-based tab bar
  │   │   ├── Table.tsx                   ← sortable + pagination aware
  │   │   ├── Stat.tsx                    ← KPI tile (label + value + delta)
  │   │   ├── Switch.tsx
  │   │   ├── Checkbox.tsx
  │   │   ├── Pagination.tsx
  │   │   ├── ConfirmDialog.tsx
  │   │   ├── Skeleton.tsx
  │   │   ├── Toast.tsx                   ← sonner wrapper
  │   │   ├── EmptyState.tsx
  │   │   ├── Logo.tsx
  │   │   └── ThemeToggle.tsx
  │   └── onboarding/
  │       └── SetupWizard.tsx             ← first-run company setup wizard
  │
  ├── lib/
  │   ├── auth.ts                         ← NextAuth config (credential provider)
  │   ├── auth.config.ts                  ← edge-compatible config
  │   ├── prisma.ts                       ← singleton PrismaClient
  │   ├── permissions.ts                  ← RBAC hasPermission, ROLE_PERMISSIONS
  │   ├── audit.ts                        ← logAudit() helper
  │   ├── notifications.ts                ← createNotification() helper
  │   ├── nav.ts                          ← navSections: NavSection[] (RBAC-aware)
  │   ├── theme.ts                        ← useTheme() hook
  │   ├── theme-script.ts                 ← inline script string for FOUC prevention
  │   ├── utils.ts                        ← cn(), formatCurrency(), formatDate()
  │   ├── pagination.ts                   ← parsePagination() server helper
  │   └── status.ts                       ← status → badge variant maps
  │
  ├── services/
  │   ├── client.service.ts
  │   ├── project.service.ts
  │   ├── task.service.ts
  │   ├── invoice.service.ts
  │   ├── payroll.service.ts
  │   ├── attendance.service.ts
  │   ├── expense.service.ts
  │   ├── report.service.ts
  │   └── dashboard.service.ts
  │
  ├── styles/
  │   └── tokens.css                      ← SINGLE SOURCE OF TRUTH (see §4)
  │
  ├── prisma/
  │   ├── schema.prisma
  │   ├── migrations/
  │   └── seed.ts
  │
  ├── scripts/
  └── middleware.ts                       ← NextAuth + role redirect


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§4  DESIGN SYSTEM (TOKEN CONTRACT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE: Zero hex values or hardcoded spacing in components. Every visual
property references a CSS custom property from styles/tokens.css.

  PALETTE — SAME AS VAPE-OS (copy + adapt)
  ──────────────────────────────────────────
    Light: Titanium/Silver monochrome
      --color-neutral-0  → #ffffff
      --color-neutral-50 → #fafafa
      …up to neutral-900
      --color-black      → #0a0a0a
      --color-primary-* → maps to neutral ramp

    Dark: [data-theme="dark"] block
      --surface-page     → #0a0a0a
      --surface-card     → #131315
      --surface-sidebar  → #0c0c0e
      --border-default   → rgba(255,255,255,0.08)

    Functional accents (status only):
      --color-danger-*   success/warning/info-*

  TOKEN CATEGORIES
  ─────────────────
    Colors       --color-neutral-*, --color-primary-*, --color-danger-*, …
    Surfaces     --surface-page, --surface-card, --surface-sidebar,
                 --surface-input, --surface-overlay
    Borders      --border-default, --border-input, --border-focus
    Text         --text-primary, --text-secondary, --text-tertiary,
                 --text-inverse, --text-brand, --text-danger
    Interactive  --interactive-primary, --interactive-primary-hover,
                 --interactive-primary-bg, --interactive-secondary-hover
    Sidebar      --sidebar-width (16rem), --sidebar-bg, --sidebar-border,
                 --sidebar-item-active-bg, --sidebar-item-text, …
    Header       --header-height (3.5rem), --header-bg, --header-border
    Typography   --font-sans, --font-mono, --text-xs … --text-4xl,
                 --font-normal … --font-bold, --leading-*
    Spacing      --space-0 … --space-24 (4pt grid)
    Layout       --page-px, --page-py, --layout-gap, --section-gap,
                 --card-pad, --field-gap  (responsive in @media blocks)
    Radius       --radius-sm … --radius-full
    Shadows      --shadow-xs … --shadow-xl
    Transitions  --transition-fast (100ms), --transition-normal (200ms),
                 --transition-slow (300ms)
    Z-index      --z-below(-1) … --z-toast(500)

    Agency-specific additions:
    Status tokens for ALL entity lifecycles (mirroring vape-os pattern):
      --status-active-*, --status-draft-*, --status-paused-*,
      --status-completed-*, --status-cancelled-*, --status-overdue-*,
      --status-pending-*, --status-approved-*, --status-rejected-*,
      --status-lost-*, --status-won-*
    These map badge background/foreground/dot — one source, no per-page overrides.

  DARK MODE TRIGGER
  ──────────────────
    <html data-theme="dark"> or <html> (light is default)
    CSS: [data-theme="dark"] { … remap all tokens … }
    NO .dark class. NO next-themes package.
    Theme is stored in localStorage key "acos-theme".
    Inline <script> in <head> reads localStorage before paint → no flash.

  COMPONENT STYLING RULE
  ───────────────────────
    // ✅ Correct
    className="bg-[var(--surface-card)] border border-[var(--border-default)]"

    // ❌ Wrong
    className="bg-white border border-gray-200"
    className="bg-card"             ← shadcn alias, do not use


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§5  LAYOUT SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  DashboardShell (client component)
  ───────────────────────────────────
    - div.flex.h-dvh.overflow-hidden
    - Sidebar (fixed on mobile, static on md+)
    - backdrop overlay on mobile when sidebar open
    - main: min-w-0 flex-1 bg-[var(--surface-page)] overflow-y-auto
    - Exposes useOpenSidebar() context for Header hamburger

  Sidebar (client component)
  ──────────────────────────
    - aside: fixed inset-y-0 left-0 z-50 md:static md:z-auto
    - Width: var(--sidebar-width) = 16rem
    - Top brand section with Logo + mobile close button
    - Scrollable nav: navSections from lib/nav.ts (RBAC-filtered)
    - Section headers: 10px uppercase tracking-wider sidebar-section-text
    - Active item: sidebar-item-active-bg + sidebar-item-active-text
    - Footer: ThemeToggle with label

  Header (client component)
  ──────────────────────────
    - height: var(--header-height) = 3.5rem
    - Left: hamburger (mobile) + breadcrumb
    - Right: notifications bell + user menu (avatar + dropdown)

  PageContainer (server or client)
  ─────────────────────────────────
    - px-[var(--page-px)] py-[var(--page-py)]
    - max-w-7xl mx-auto (on wide-screen dashboards)
    - Exports <PageHeader title actions> sub-component

  (internal)/layout.tsx pattern
  ──────────────────────────────
    export default async function InternalLayout({ children }) {
      const session = await auth();
      if (!session?.user) redirect("/login");
      if (session.user.role === "CLIENT") redirect("/portal");
      return (
        <>
          <DashboardShell>{children}</DashboardShell>
          <Toaster />
        </>
      );
    }
    // Header is rendered inside DashboardShell, NOT in the layout.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§6  MODULE MAP (ALL ROUTES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  INTERNAL APP (staff-facing)                                                │
  ├──────────────────┬──────────────────────────────────────────────────────────┤
  │  OVERVIEW        │  /dashboard                                              │
  ├──────────────────┼──────────────────────────────────────────────────────────┤
  │  SALES & CRM     │  /crm         — pipeline + list                         │
  │                  │  /crm/[id]    — lead detail + timeline                  │
  │                  │  /clients     — table + filters                          │
  │                  │  /clients/[id]— detail: contacts, projects, invoices,    │
  │                  │                onboarding checklist, activity log        │
  ├──────────────────┼──────────────────────────────────────────────────────────┤
  │  WORK            │  /projects    — kanban + list                            │
  │                  │  /projects/[id]— detail: tasks, members, time, docs     │
  │                  │  /tasks       — my tasks + all tasks (filterable)        │
  │                  │  /time        — timer widget + weekly entries            │
  ├──────────────────┼──────────────────────────────────────────────────────────┤
  │  TEAM            │  /team        — employee directory + onboarding          │
  │                  │  /team/[id]   — profile: salary, leave, attendance       │
  │                  │  /attendance  — daily grid + monthly calendar            │
  │                  │  /leave       — request form + approval queue            │
  │                  │  /payroll     — monthly payroll run                      │
  │                  │  /payroll/[id]— payroll detail + slip download           │
  ├──────────────────┼──────────────────────────────────────────────────────────┤
  │  FINANCE         │  /invoices    — table + status filters                   │
  │                  │  /invoices/[id]— detail + line items + payments          │
  │                  │  /invoices/new— create/edit form                        │
  │                  │  /payments    — payment register                         │
  │                  │  /expenses    — expense log + category chart             │
  │                  │  /revenue     — P&L: revenue vs expenses vs payroll      │
  ├──────────────────┼──────────────────────────────────────────────────────────┤
  │  INSIGHTS        │  /reports     — pre-built report list + export           │
  │                  │  /documents   — file browser (scoped by entity)          │
  ├──────────────────┼──────────────────────────────────────────────────────────┤
  │  SYSTEM          │  /notifications— notification center                    │
  │                  │  /audit-logs  — filterable audit trail                   │
  │                  │  /settings    — company, roles, billing, integrations    │
  └──────────────────┴──────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  CLIENT PORTAL (client-facing)                                              │
  ├──────────────────┬──────────────────────────────────────────────────────────┤
  │                  │  /portal           — overview: projects + invoices       │
  │                  │  /portal/projects  — client's projects                   │
  │                  │  /portal/projects/[id] — tasks (client-visible only)     │
  │                  │  /portal/invoices  — invoices + payment links            │
  │                  │  /portal/tickets   — support ticket form (future)        │
  └──────────────────┴──────────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§7  NAVIGATION CONFIG (lib/nav.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  navSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard",   href: "/dashboard",     icon: LayoutDashboard },
      ],
    },
    {
      title: "Sales & CRM",
      items: [
        { label: "CRM / Leads", href: "/crm",           icon: TrendingUp,  permission: "crm:view" },
        { label: "Clients",     href: "/clients",        icon: Building2,   permission: "clients:view" },
      ],
    },
    {
      title: "Work",
      items: [
        { label: "Projects",    href: "/projects",       icon: Briefcase,   permission: "projects:view" },
        { label: "Tasks",       href: "/tasks",          icon: CheckSquare, permission: "tasks:view" },
        { label: "Time",        href: "/time",           icon: Clock,       permission: "time:track" },
      ],
    },
    {
      title: "Team",
      items: [
        { label: "Employees",   href: "/team",           icon: Users,       permission: "team:view" },
        { label: "Attendance",  href: "/attendance",     icon: UserCheck,   permission: "attendance:view_own" },
        { label: "Leave",       href: "/leave",          icon: Calendar,    permission: "leave:view_own" },
        { label: "Payroll",     href: "/payroll",        icon: DollarSign,  permission: "payroll:view_own" },
      ],
    },
    {
      title: "Finance",
      items: [
        { label: "Invoices",    href: "/invoices",       icon: FileText,    permission: "invoices:view" },
        { label: "Payments",    href: "/payments",       icon: CreditCard,  permission: "payments:view" },
        { label: "Expenses",    href: "/expenses",       icon: Receipt,     permission: "expenses:view" },
        { label: "Revenue",     href: "/revenue",        icon: TrendingUp,  permission: "revenue:view" },
      ],
    },
    {
      title: "Insights",
      items: [
        { label: "Reports",     href: "/reports",        icon: BarChart3,   permission: "reports:view" },
        { label: "Documents",   href: "/documents",      icon: FolderOpen,  permission: "documents:view" },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notifications",href:"/notifications",  icon: Bell,        permission: "notifications:view" },
        { label: "Audit Logs",  href: "/audit-logs",     icon: ClipboardList,permission: "audit:view" },
        { label: "Settings",    href: "/settings",       icon: Settings,    permission: "settings:view" },
      ],
    },
  ]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§8  STACK DECISIONS (FINAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Framework        Next.js 16 (App Router, RSC default)
  Language         TypeScript 5 (strict)
  Database         PostgreSQL + Prisma v7
  Auth             NextAuth v5 (credentials + Prisma adapter)
  Styling          Tailwind v4 + CSS custom properties (tokens)
  Component lib    Custom (no shadcn) — Radix for a11y primitives only
  State            React state/context — no Zustand/Jotai
  Forms            React Hook Form + Zod
  Charts           Recharts
  Date             date-fns v4
  Toast            Sonner
  Icons            Lucide React
  PDF              @react-pdf/renderer (server-side)
  Email            Resend + react-email
  File storage     Local (dev) + Cloudflare R2 / S3 (prod)
  Package manager  pnpm
  Testing          Vitest
  Linting          ESLint 9 (flat config)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§9  PHASED DEVELOPMENT PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each phase is a complete, shippable increment. Never leave the app in a broken
state at the end of a phase. Complete each phase before starting the next.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0 — FOUNDATION (Design System + Layout Engine)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: The app opens, renders, and respects dark/light mode. Shell layout works.
  No page content — just infrastructure.

  TASKS
  ─────
  0.1  Restructure folders
       - Remove src/ wrapper: move src/app → app/, src/components → components/,
         src/lib → lib/, src/services → services/, src/types → types/
       - Update all absolute imports (@/ paths) to reflect new structure
       - Verify tsconfig.json paths section

  0.2  Upgrade Tailwind v3 → v4
       - Replace tailwindcss@3 + autoprefixer + postcss config
       - Install tailwindcss@4 + @tailwindcss/postcss
       - Update postcss.config.mjs to { "@tailwindcss/postcss": {} }
       - Remove tailwind.config.ts (not needed in v4)
       - Update globals.css: @import "tailwindcss" + @import "../styles/tokens.css"

  0.3  Create styles/tokens.css
       - Copy vape-os tokens.css as the base
       - Add agency-specific status tokens for all entity statuses:
         --status-completed-*, --status-cancelled-*, --status-overdue-*,
         --status-pending-*, --status-approved-*, --status-rejected-*,
         --status-won-*, --status-lost-*, --status-on-hold-*
       - Do NOT change any token names that vape-os already defined

  0.4  Theme system
       - Create lib/theme-script.ts (inline script string for FOUC prevention)
       - Create lib/theme.ts (useTheme hook — identical to vape-os)
       - Inject theme script in app/layout.tsx root <head> via dangerouslySetInnerHTML
       - Add ACOS_THEME_KEY = "acos-theme" constant

  0.5  Core UI components
       - components/ui/Button.tsx     (copy vape-os pattern, 5 variants, 4 sizes)
       - components/ui/Card.tsx       (surface-card + border-default + radius-lg)
       - components/ui/Input.tsx      (label slot, error, icon-left/right)
       - components/ui/Select.tsx     (Radix primitive, token-styled)
       - components/ui/Modal.tsx      (Radix Dialog, token-styled overlay + panel)
       - components/ui/Badge.tsx      (status-* token variants)
       - components/ui/Avatar.tsx     (initials fallback)
       - components/ui/Stat.tsx       (KPI tile: label + value + optional delta)
       - components/ui/Skeleton.tsx   (pulse animation using neutral-100/200)
       - components/ui/EmptyState.tsx (icon + heading + body + optional CTA)
       - components/ui/Logo.tsx       (text logo "Agency OS" in brand font)
       - components/ui/ThemeToggle.tsx (sun/moon icon toggle, withLabel prop)
       - components/ui/Toast.tsx      (sonner Toaster wrapped with token colors)
       - components/ui/index.ts       (barrel export)

  0.6  Layout components
       - lib/nav.ts                   (navSections — static, no RBAC filter here)
       - components/layout/Sidebar.tsx
           - Uses token vars: sidebar-bg, sidebar-border, sidebar-item-*
           - RBAC-filtered: accepts role prop, filters navSections via hasPermission
           - Mobile: fixed inset-y-0, animated translate-x
           - Footer: ThemeToggle withLabel
       - components/layout/Header.tsx
           - height: var(--header-height)
           - Left: hamburger (mobile) + breadcrumb context
           - Right: notification bell (badge count) + user avatar + dropdown
       - components/layout/DashboardShell.tsx
           - flex h-dvh overflow-hidden
           - sidebar overlay on mobile
           - Exposes OpenSidebarCtx
       - components/layout/PageContainer.tsx
           - px-[var(--page-px)] py-[var(--page-py)]
           - Exports PageHeader({ title, description, actions })

  0.7  Root layout
       - app/layout.tsx: Geist font, theme script inject, html lang="en"
       - app/globals.css: imports, body token references, scrollbar, selection
       - Remove all shadcn CSS variable blocks

  0.8  Login page
       - app/(auth)/layout.tsx: centered card layout, surface-page bg
       - app/(auth)/login/page.tsx: server (redirect if authed)
       - app/(auth)/login/LoginClient.tsx: form with email/password using
         our custom Input + Button + Card — no shadcn
       - Remove all shadcn component imports from login

  0.9  (internal)/layout.tsx
       - Server component: auth guard, CLIENT redirect
       - Wraps DashboardShell + Toaster

  DELIVERABLE: npm run dev → app loads, login works, sidebar renders with
               correct tokens, dark mode toggle works with no flash.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — DASHBOARD + CORE DATA LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Landing page after login shows meaningful data. Data layer solid.

  TASKS
  ─────
  1.1  Dashboard KPI row (services/dashboard.service.ts)
       - Total revenue this month (sum of paid invoices)
       - Total expenses this month (sum of approved expenses + payroll)
       - Active clients count
       - Active projects count
       - Open leads in pipeline
       - Team headcount

  1.2  Dashboard revenue chart
       - 12-month revenue vs expenses bar/line chart (Recharts)
       - Data: monthly grouped invoices paid vs expenses approved
       - Uses token colors for series

  1.3  Dashboard recent activity feed
       - Last 10 audit log entries rendered as timeline
       - Uses AuditLog entity + user name

  1.4  Dashboard quick actions
       - New Lead, New Invoice, Check In — 3 action buttons below KPIs

  1.5  Seed data
       - prisma/seed.ts: owner user + sample employees, clients, projects,
         invoices, expenses — enough to make the dashboard non-empty

  1.6  API layer cleanup
       - Review existing API routes, add missing CRUD routes with proper
         RBAC guards (getServerSession → check permission)
       - Standardize response shape: { data, error, meta? }
       - Add parsePagination() to all list endpoints

  DELIVERABLE: Dashboard shows real data from seed, charts render, no errors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — CRM + CLIENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Full lead pipeline + client management workflow.

  TASKS
  ─────
  2.1  CRM — Pipeline Kanban
       - Drag-free (no dnd library) — move via status dropdown on card
       - Columns: NEW_LEAD → CONTACTED → QUALIFIED → PROPOSAL_SENT → NEGOTIATION
       - Each card: name, company, value, email/phone icons, relative date
       - Quick-edit modal on card click

  2.2  CRM — List view
       - Sortable table with search + status filter + service filter
       - Bulk delete for OWNER/ADMIN

  2.3  Lead Detail page (/crm/[id])
       - Lead info + edit form
       - Activity timeline (manual log entries)
       - Convert to Client action (fills clientId, sets status WON)

  2.4  Clients — Table page
       - Search + status filter + country filter
       - Sortable by name, status, revenue
       - Status badge using --status-* tokens

  2.5  Client Detail page (/clients/[id])
       Tabs: Overview | Contacts | Projects | Invoices | Documents | Onboarding
       - Overview: revenue, active projects, open invoices, notes
       - Contacts: contact cards + add/edit/delete
       - Projects: linked project list
       - Invoices: client invoice history + total paid
       - Documents: client-scoped document list
       - Onboarding: ClientOnboarding checklist (17 items + custom items)

  2.6  Client CRUD API
       - POST /api/clients — create with clientId auto-gen (CLT-001)
       - PATCH /api/clients/[id]
       - DELETE /api/clients/[id] (soft delete)
       - POST /api/clients/[id]/onboarding — update checklist item

  DELIVERABLE: Full CRM → Client lifecycle works end-to-end.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — PROJECTS + TASKS + TIME TRACKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: End-to-end project management with tasks and time tracking.

  TASKS
  ─────
  3.1  Projects list — two views
       - Kanban (by status): PLANNED / ACTIVE / ON_HOLD / IN_REVIEW / COMPLETED
       - Table: sortable by client, status, due date, budget

  3.2  Project Detail page (/projects/[id])
       Tabs: Tasks | Members | Time Log | Files | Comments
       - Header: project name, status badge, progress bar (tasks completed/total)
       - Tasks tab: filterable task board within project
       - Members tab: add/remove ProjectMember
       - Time Log: time entries for this project + total hours

  3.3  Task system
       - /tasks: "My Tasks" + "All Tasks" (permission-gated)
       - Filters: status, priority, assignee, project, due date range
       - TaskFormModal: title, description, project, assignee, priority, status,
         dueDate, estimatedHours, checklist items, visibility
       - Task card: priority badge, assignee avatar, due date color (overdue=red)
       - TaskDetail slide-over: full detail + comments + checklist + attachments

  3.4  Time Tracker (/time)
       - Timer widget: Start/Stop — persists to DB on stop
       - Task + project selector on running entry
       - Week view: entries grouped by day, total hours per day
       - Manual entry: add past time entry
       - Timer polling: useEffect 30s interval → GET /api/time/active

  3.5  API routes
       - /api/projects CRUD
       - /api/tasks CRUD + /api/tasks/[id]/comments
       - /api/time — list, create, update, delete
       - /api/time/active — returns running entry or null
       - /api/time/start — creates entry with startTime=now, endTime=null
       - /api/time/stop — sets endTime=now, calculates duration

  DELIVERABLE: Projects → Tasks → Time tracking fully connected.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — TEAM + HR (Attendance, Leave, Employees)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Team directory, daily attendance, leave requests — HR fully self-served.

  TASKS
  ─────
  4.1  Employees (/team)
       - Card grid + table toggle
       - Employee card: avatar initials, name, position, department, status badge
       - EmployeeFormModal: all fields from Employee model
       - Employee status change (ACTIVE/ON_LEAVE/SUSPENDED/TERMINATED)

  4.2  Employee Detail (/team/[id])
       Tabs: Profile | Attendance | Leave | Payroll | Salary History | Documents
       - Profile: all employee fields, emergency contact
       - Attendance: monthly grid (calendar view) + stats row
       - Leave: leave balance cards + request history
       - Salary History: timeline of salary changes

  4.3  Attendance (/attendance)
       - Own view (EMPLOYEE): today's check-in status + weekly calendar
       - All view (HR/ADMIN): date selector + grid of all employees that day
       - Check-in/out button: calls /api/attendance/check-in and /check-out
       - Late detection: if check-in > shift start + grace period → LATE status

  4.4  Leave (/leave)
       - Employee: request leave form (type, dates, reason) + my leave history
       - HR/Admin: approval queue + APPROVE/REJECT actions with note
       - Leave balance summary per type

  4.5  API routes
       - /api/employees CRUD
       - /api/attendance + check-in + check-out + monthly summary
       - /api/leave + [id]/approve + [id]/reject
       - /api/leave-types CRUD (HR/ADMIN only)
       - /api/leave-balance — employee balances

  DELIVERABLE: Full employee lifecycle and HR self-service.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — INVOICES + PAYMENTS + EXPENSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Full financial operations — create invoice, send, mark paid, log expense.

  TASKS
  ─────
  5.1  Invoices (/invoices)
       - Table: number, client, total, status badge, due date (overdue=red), actions
       - Status filter tabs: All | Draft | Sent | Paid | Overdue
       - Bulk: mark paid, send, delete

  5.2  Invoice Create/Edit (/invoices/new, /invoices/[id]/edit)
       - Client selector, project (optional), issue date, due date
       - Line item builder: description, qty, unit price, service tag, subtotal
       - Discount section: percentage or fixed amount
       - Tax rate field, auto-calculated tax amount
       - Totals footer: subtotal → discount → tax → total
       - Notes + internal notes
       - Save as Draft or Send immediately

  5.3  Invoice Detail (/invoices/[id])
       - Preview panel (styled as the PDF output)
       - Status timeline: DRAFT → SENT → PARTIALLY_PAID / PAID / OVERDUE
       - Payment history: received amounts + remaining balance
       - Actions: Edit | Send | Record Payment | Download PDF | Duplicate

  5.4  PDF generation
       - GET /api/invoices/[id]/pdf — streams PDF
       - Renders: company letterhead, client info, line items table, total,
         payment terms, bank details from CompanySetting

  5.5  Payments (/payments)
       - Payment register table: pay number, client, invoice ref, amount, method, date
       - Record Payment modal: invoice selector, amount, date, method, reference
       - Auto-updates Invoice.amountPaid + balanceDue + status on create

  5.6  Expenses (/expenses)
       - Table: date, vendor, description, category badge, amount, status
       - Category breakdown chart (donut) in sidebar
       - Expense form: date, vendor, category, amount, method, receipt upload
       - Recurring expense toggle → creates RecurringExpense record

  5.7  API routes
       - /api/invoices CRUD + /api/invoices/[id]/pdf + /api/invoices/[id]/send
       - /api/payments CRUD
       - /api/expenses CRUD
       - /api/recurring-invoices CRUD

  DELIVERABLE: Full billing cycle — invoice → send → payment → reconciled.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — PAYROLL + REVENUE DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Monthly payroll run + P&L overview.

  TASKS
  ─────
  6.1  Payroll (/payroll)
       - Monthly payroll list: Month | Year | Status badge | Employee count | Total
       - Create payroll run: auto-populates from employee base salaries,
         attendance (present days), leave deductions, manual allowances/bonuses
       - PayrollEmployee editor: per-employee adjustments
       - Approve payroll (OWNER/ADMIN) → status=APPROVED
       - Mark as Paid → status=PAID

  6.2  Payroll Slip
       - GET /api/payroll/[id]/slip/[employeeId] — PDF slip
       - Includes: employee info, period, gross, deductions, net, stamp
       - Email slip to employee via Resend on mark-as-paid

  6.3  Revenue Dashboard (/revenue)
       - P&L summary for selected period:
         Revenue (paid invoices) vs Total Expenses (expenses + payroll) = Net Profit
       - Monthly trend chart (12 months)
       - Expense breakdown by category (horizontal bar chart)
       - Owner withdrawals log + total
       - Financial period close action (OWNER/ACCOUNTANT)

  6.4  API routes
       - /api/payroll CRUD + /api/payroll/[id]/approve + /api/payroll/[id]/pay
       - /api/payroll/[id]/slip/[employeeId] PDF
       - /api/revenue/summary — P&L aggregation

  DELIVERABLE: Payroll run works, P&L numbers are visible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7 — REPORTS + DOCUMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Pre-built reports + file management.

  TASKS
  ─────
  7.1  Reports (/reports)
       Pre-built report cards (click → generate + preview):
       - Revenue Report: paid invoices, grouped by client/month
       - Expense Report: by category, date range
       - Payroll Report: monthly payroll totals, year to date
       - Attendance Report: employee present/absent/leave counts
       - Project Profitability: revenue vs logged hours × rate vs expenses
       - Client Activity: last project, last invoice, outstanding balance
       Each report: table preview + Export CSV button

  7.2  Document Management (/documents)
       - Tree view: Client / Project / Employee / Invoice tabs
       - File grid: thumbnail (PDF/image) + file name + type badge + upload date
       - Upload: drag-and-drop or file picker → POST /api/documents/upload
       - File storage: local in dev (public/uploads/), R2 in prod
       - Delete (soft-delete) + Download link
       - Document type filter (CONTRACT, RECEIPT, etc.)

  7.3  API routes
       - /api/reports/[type] — data endpoint for each report type
       - /api/documents — list + delete
       - /api/documents/upload — multipart form, store file, return URL
       - /api/documents/[id]/download — proxied download

  DELIVERABLE: Reports exportable, files uploadable and browsable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 8 — CLIENT PORTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Clients can log in and self-serve.

  TASKS
  ─────
  8.1  Portal shell
       - app/(portal)/layout.tsx: minimal header (logo + client name + logout)
       - Lighter sidebar or top-nav (not the full internal sidebar)
       - Surface color: same token system, no dark mode toggle (clients use light)

  8.2  Portal overview (/portal)
       - Welcome banner: "Hello {company}"
       - Open invoices: due date, amount, status
       - Active projects: name + last update + progress %
       - Unread notifications

  8.3  Portal projects (/portal/projects)
       - Client sees their projects only
       - Per project: task board with CLIENT_VISIBLE tasks only
       - Comment thread (CLIENT_VISIBLE comments)
       - File list (non-private documents on project)

  8.4  Portal invoices (/portal/invoices)
       - Invoice table: number, amount, status, due date
       - Click invoice → detail view with line items
       - Download PDF button
       - Payment link (external — Stripe payment link from CompanySetting)

  8.5  Portal auth
       - Same NextAuth credential login but CLIENT role → redirects to /portal
       - Invite flow: ADMIN creates ClientUser, sends invite email via Resend
         with temp password or magic link

  DELIVERABLE: Client logs in, sees their projects + invoices, cannot see
               internal data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 9 — SETTINGS + NOTIFICATIONS + AUDIT LOGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Admin controls, notification center, full audit trail.

  TASKS
  ─────
  9.1  Settings (/settings)
       Tabs: Company | Team | Finance | Integrations | Danger Zone
       - Company: name, logo, address, currency, timezone, fiscal year start
       - Team: leave types CRUD, holidays CRUD, roles reference
       - Finance: default payment terms, tax rate, bank details (for PDF invoices)
       - Integrations: Resend API key, R2/S3 credentials, Stripe payment link
       - Danger Zone: export all data (OWNER only), reset (OWNER only)

  9.2  Notifications (/notifications)
       - Full list: type icon, title, message, relative time, read/unread dot
       - Mark all read button
       - Click → navigate to entity (invoice, task, leave request)
       - Header bell: badge with unread count (polled every 60s)

  9.3  Audit Logs (/audit-logs)
       - Table: performed by, action, entity, entity ID, description, timestamp
       - Filters: action type, entity, user, date range
       - Search by description
       - Export CSV

  9.4  First-run Setup Wizard
       - components/onboarding/SetupWizard.tsx (shown if company not configured)
       - Step 1: Company name + timezone + currency
       - Step 2: Add first employee (themselves)
       - Step 3: Set default leave types
       - Step 4: Done — tour callout pointing to CRM

  DELIVERABLE: Admin can configure everything, audit trail is complete.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 10 — POLISH + PERFORMANCE + TESTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Goal: Production-ready. No rough edges. Test coverage on critical paths.

  TASKS
  ─────
  10.1  Responsive review — all pages on 375px, 768px, 1280px, 1440px
  10.2  Skeleton loading states — all data-fetching pages
  10.3  Empty states — all list pages with zero records
  10.4  Error boundaries — all data-fetching pages
  10.5  Optimistic updates — attendance check-in, task status change
  10.6  Notification triggers — wire logNotification() calls:
        - Invoice sent → client user notification
        - Leave request submitted → HR notification
        - Leave approved/rejected → employee notification
        - Task assigned → assignee notification
        - Invoice overdue (cron? or on-view detection)
  10.7  Recurring invoice generator
        - Script/API to check RecurringInvoice.nextDate, create Invoice, advance date
  10.8  Vitest unit tests
        - lib/permissions.ts (RBAC matrix)
        - services/invoice.service.ts (total calculations)
        - services/payroll.service.ts (net salary calculation)
        - lib/utils.ts (formatCurrency, formatDate)
  10.9  Security hardening
        - Rate limit on /api/auth/login
        - Ensure all API routes check getServerSession + hasPermission
        - Validate all inputs with Zod
        - CSP headers in next.config.ts (copy vape-os pattern)
  10.10 Middleware update
        - Route protection matrix: /dashboard+ → internal roles only
        - /portal+ → CLIENT role only
        - /api/+ → no redirect, return 401

  DELIVERABLE: Ship-ready. Verifiable test pass, no console errors.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§10  PHASE SUMMARY TABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌───────┬──────────────────────────────────────┬──────────────────────────────┐
  │ Phase │ Scope                                │ Deliverable                  │
  ├───────┼──────────────────────────────────────┼──────────────────────────────┤
  │   0   │ Design system, layout, theme, Tw v4  │ App opens, shell works       │
  │   1   │ Dashboard + data layer + seed        │ Real KPIs on screen          │
  │   2   │ CRM + Clients                        │ Lead→client pipeline done    │
  │   3   │ Projects + Tasks + Time              │ Work management done          │
  │   4   │ Team + Attendance + Leave            │ HR self-service done          │
  │   5   │ Invoices + Payments + Expenses       │ Billing cycle done            │
  │   6   │ Payroll + Revenue P&L               │ Financial ops done            │
  │   7   │ Reports + Documents                  │ Insights + files done         │
  │   8   │ Client Portal                        │ Client self-service done      │
  │   9   │ Settings + Notifications + Audit     │ Admin controls done           │
  │  10   │ Polish + Tests + Security            │ Production ready              │
  └───────┴──────────────────────────────────────┴──────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§11  CROSS-CUTTING RULES (apply every phase)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  STYLING
    - Zero hardcoded colors, spacing, or shadows in components
    - Every className references a CSS custom property or a Tailwind utility
      that maps to one (gap-4 → fine; bg-white → wrong)
    - Dark mode always tested before ending a phase

  API ROUTES
    - Always call await auth() + hasPermission(role, "…") before any DB op
    - Return { data, error } shape consistently
    - Zod-validate every mutation body

  FORMS
    - React Hook Form + Zod schema
    - Error messages rendered with text-[var(--text-danger)] below fields
    - Submit button shows loading spinner

  TABLES / LISTS
    - All lists have: search input, at least one filter, pagination (page size 25)
    - Skeleton rows during loading (same column count as real rows)
    - Empty state with icon + message + primary CTA if user has create permission

  MODALS
    - Standard shape: Modal > header (title + close) > scrollable body > footer (actions)
    - Close on Escape, click-outside
    - Focus trapped inside while open

  AUDIT LOGGING
    - Every destructive or sensitive mutation calls logAudit()
    - Entities: CREATE, UPDATE, DELETE, APPROVE, REJECT, SEND, PAY, LOGIN

  AUTO-ID GENERATION
    - clientId: CLT-{padded 3-digit counter}
    - projectId: PRJ-{padded 3-digit counter}
    - taskId: TSK-{padded 3-digit counter}
    - invoiceNumber: INV-{YYYY}-{padded 4-digit counter}
    - paymentNumber: PAY-{YYYY}-{padded 4-digit counter}
    - expenseId: EXP-{padded 3-digit counter}
    - employeeId: EMP-{padded 3-digit counter}
    Counter = count existing records + 1 (not max ID — avoids gaps after soft delete)

  SOFT DELETE
    - Models with deletedAt: Client, Employee, Lead, Project, Task, Invoice,
      Payment, Expense, Document
    - ALL Prisma queries on these models must include where: { deletedAt: null }
    - Service layer methods enforce this, not the API layer


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§12  ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  # Required
  DATABASE_URL="postgresql://user:pass@localhost:5432/agency_os"
  NEXTAUTH_SECRET="…"
  NEXTAUTH_URL="http://localhost:3000"

  # Email (Phase 8+)
  RESEND_API_KEY="…"
  RESEND_FROM="Agency OS <noreply@yourdomain.com>"

  # File Storage (Phase 7+)
  STORAGE_DRIVER="local"                   # or "r2"
  R2_ACCOUNT_ID="…"
  R2_ACCESS_KEY_ID="…"
  R2_SECRET_ACCESS_KEY="…"
  R2_BUCKET_NAME="agency-os-documents"
  R2_PUBLIC_URL="https://pub.r2.dev/…"

  # Optional
  STRIPE_PAYMENT_LINK="https://buy.stripe.com/…"  # for portal invoice pay button


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§13  WHAT NOT TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗ Do not use next-themes (we own our theme system)
  ✗ Do not use shadcn/ui or its CSS variables
  ✗ Do not use .dark CSS class for dark mode
  ✗ Do not leave `text-green-600` or `bg-blue-100` in components
  ✗ Do not add Zustand, Jotai, or Redux — React state is enough
  ✗ Do not add a separate REST client (axios/swr/react-query) — use fetch or
    server components with direct Prisma calls
  ✗ Do not change the Prisma schema mid-phase without a migration plan
  ✗ Do not render sensitive data (salary, full client financials) to CLIENT role
  ✗ Do not skip the auth/permission check in any API route
  ✗ Do not use npm — this project uses pnpm
  ✗ Do not inline any styles with hex values or px numbers


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
§14  STARTING CONTEXT FOR EACH SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  When beginning a new development session, say:
  "I'm working on Agency OS. Current phase: [X]. Last completed: [Y].
   Design system: vape-os token pattern. No shadcn. No .dark class.
   Read PROPOSAL.d for full context before starting."

  Reference vape-os project at:
  /Users/user/Desktop/my-projects/vape-os/styles/tokens.css   — copy token definitions
  /Users/user/Desktop/my-projects/vape-os/components/ui/      — copy component patterns
  /Users/user/Desktop/my-projects/vape-os/components/layout/  — copy layout pattern
  /Users/user/Desktop/my-projects/vape-os/lib/theme.ts        — copy theme hook
  /Users/user/Desktop/my-projects/vape-os/lib/theme-script.ts — copy theme script
  /Users/user/Desktop/my-projects/vape-os/app/globals.css     — copy globals pattern

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF PROPOSAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
