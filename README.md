# Amzetix -OS

> **Enterprise Operating System for Modern Tech & Marketing Agencies** — Streamline project delivery, client collaboration, financial operations, automated payroll, time tracking, and team administration in one unified platform.

[![Next.js](https://img.shields.io/badge/Next.js-16.3+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-7+-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Modules & Features](#-key-modules--features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Database Management](#-database-management)
- [Storage & Email Delivery](#-storage--email-delivery)
- [Security & Authentication](#-security--authentication)
- [Available Scripts](#-available-scripts)
- [Roadmap](#-roadmap)
- [License & Copyright](#-license--copyright)

---

## 🎯 Overview

**Amzetix -OS** is an all-in-one business management and enterprise resource planning system tailored for digital agencies, tech consultancies, and marketing firms. It bridges the gap between client relationship management (CRM), project execution, employee operations, financial accounting, and client transparency.

### Core Objectives:
- **Unified Command Center**: High-level agency metrics, financial health, employee velocity, and active client pipeline.
- **Client Transparency**: Dedicated client portal with real-time project milestone tracking, document access, and invoice self-service.
- **Operational Automation**: Automated payroll calculation with deductions, leave balance tracking, and scheduled client invoicing.
- **Enterprise-Grade Security**: Role-based access control (RBAC), TLS 1.3 encryption, structured audit logging, and automated session invalidation.

---

## ✨ Key Modules & Features

### 1. 💼 Client & CRM Operations
- **Leads & Pipeline**: Multi-stage CRM pipeline (`NEW_LEAD`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`) with estimated value tracking.
- **Client Directory**: Centralized client profiles, primary contact stakeholders, billing terms, tax identification, and custom service tags.
- **Client Onboarding Checklist**: Automated onboarding workflow tracking contract execution, billing setup, access credentials, brand assets, and scope definition.
- **Client Portal**: Dedicated secure client interface for tracking project milestones, approving deliverables, and paying invoices.

### 2. 🚀 Project & Sprint Management
- **Project Tracking**: Multi-service project management (`Web Development`, `Ecommerce`, `SEO`, `Content Writing`, `Digital Marketing`, `Custom Tech`).
- **Task & Sprint Board**: Kanban-ready task management with priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), statuses, checklist items, and file attachments.
- **Task Dependencies**: Blocking and dependent task graph to manage workflow bottlenecks.
- **Visibility Controls**: Granular visibility tags (`INTERNAL` vs `CLIENT_VISIBLE`) on tasks, comments, and project updates.

### 3. ⏱️ Time Tracking & Attendance
- **Live Time Tracker**: Start, pause, and log granular employee time entries tagged to specific clients, projects, and tasks.
- **Team Attendance**: Daily biometric/photo check-in & check-out logs, automated late-minutes calculation, and overtime recording.
- **Leave Management**: Configurable leave policies (Annual, Sick, Casual, Unpaid) with request approval workflows and real-time leave balance tracking.

### 4. 💰 Invoicing, Finance & Ledger
- **Invoice Generator**: Multi-currency itemized invoice builder with tax calculation, discount handling, and PDF export.
- **Recurring Invoicing**: Automated recurring billing for monthly retainers and maintenance agreements.
- **Payment Processing & History**: Track payments via Bank Transfer, Stripe, PayPal, Payoneer, and Cash.
- **Expense Management**: Categorized agency expenses, recurring subscriptions (SaaS, hosting, domains), and receipt file attachment.
- **Debt & Loan Ledger**: Track agency loans, principal balances, repayment terms, and payment schedules.
- **Owner Equity & Withdrawals**: Formal tracking of executive distributions and withdrawals.

### 5. 👥 HR & Payroll Automation
- **Employee Directory**: Complete workforce records, department assignments, emergency contacts, compensation structure, and salary history.
- **Automated Payroll Engine**: Automated monthly gross-to-net salary computation factoring in working days, attendance shortfalls, unpaid leave, overtime bonuses, and tax deductions.
- **Payslip Distribution**: Generate and dispatch electronic payslips with audit-ready records.

### 6. 📁 Cloud Document Management
- **Multi-Provider Cloud Storage**: AWS S3 integration (with support for S3-compatible endpoints like Cloudflare R2).
- **Secure File Sharing**: Presigned secure URLs for downloading client contracts, project assets, receipts, and brand files.

---

## 🛠 Architecture & Tech Stack

```
Amzetix -OS
├── Next.js 16 (App Router + React 19 + Turbopack)
├── TypeScript (End-to-end type safety)
├── Tailwind CSS 4.0 (Modern styling & dynamic theme tokens)
├── Auth.js / NextAuth v5 (RBAC + JWT 6h Rolling Sessions)
├── Prisma ORM 7 + PostgreSQL (Neon Serverless Pooler)
├── AWS SDK v3 (Amazon S3 for storage + Amazon SES / SMTP for email)
├── React Email & React PDF (HTML email templates & PDF generator)
└── Recharts (Financial analytics & velocity charts)
```

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3+ (App Router) | React 19 Server Components, Server Actions & Route Handlers |
| **Language** | TypeScript 5+ | Strict static typing across entire application |
| **Styling** | Tailwind CSS v4 | CSS variable token architecture with Light/Dark theme reactivity |
| **Database** | PostgreSQL (Neon) | Serverless relational database with connection pooling |
| **ORM** | Prisma ORM 7 | Schema migrations, typed queries, and relational models |
| **Auth** | NextAuth.js / Auth.js v5 | JWT session strategy, bcrypt hashing, role enforcement |
| **Cloud Storage** | AWS S3 / Cloudflare R2 | Asset management with presigned upload and download URLs |
| **Email Service** | Nodemailer / Amazon SES | Multi-provider dispatch for alerts, invitations, and invoices |
| **Reporting & PDF**| `@react-pdf/renderer` | Server-side invoice generation and payslip export |
| **UI Components** | Radix UI + Lucide React | Accessible UI primitives and consistent iconography |

---

## 📁 Project Structure

```
agency-os/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Authentication flows (Login, recovery)
│   ├── (internal)/             # Protected Internal Agency Workspace
│   │   ├── dashboard/          # Executive command center & analytics
│   │   ├── crm/                # CRM, leads, and client onboarding
│   │   ├── clients/            # Client directory & detailed profiles
│   │   ├── projects/           # Projects, milestones, and boards
│   │   ├── tasks/              # Task management & sprint workflows
│   │   ├── time/               # Live time tracking & time sheets
│   │   ├── attendance/         # Check-in logs & attendance records
│   │   ├── leave/              # Leave requests & quota balances
│   │   ├── invoices/           # Invoicing & recurring billing
│   │   ├── payments/           # Payment receipts & tracking
│   │   ├── expenses/           # Expense logging & subscriptions
│   │   ├── revenue/            # Revenue analytics & financial reports
│   │   ├── ledger/             # Loan management & debt accounting
│   │   ├── team/               # HR directory & employee profiles
│   │   ├── payroll/            # Automated payroll calculations
│   │   ├── documents/          # Cloud file manager (S3)
│   │   ├── audit-logs/         # Security & action audit trail
│   │   └── settings/           # Agency settings & configurations
│   ├── (portal)/               # Client Portal interface
│   ├── api/                    # REST API endpoints & Webhooks
│   ├── layout.tsx              # Root HTML & theme initialization
│   └── globals.css             # Theme design system & Tailwind styles
├── components/                 # Reusable UI & Feature Components
│   ├── auth/                   # Authentication forms
│   ├── layout/                 # Sidebar, Header, Breadcrumbs, Shared Footer
│   ├── portal/                 # Client portal navigation & views
│   ├── ui/                     # Base design system components (buttons, modals, inputs)
│   └── email/                  # React Email transactional templates
├── lib/                        # Core Utilities & Infrastructure
│   ├── auth.ts                 # NextAuth server configuration & credentials authorize
│   ├── auth.config.ts          # Edge-compatible JWT & session rules (6-hour maxAge)
│   ├── prisma.ts               # Singleton Prisma Client with PostgreSQL adapter
│   ├── s3.ts                   # AWS S3 file upload & presigned URL helpers
│   ├── email.ts                # Dual-mode email sender (SES / SMTP)
│   └── utils.ts                # Formatting, calculations, and CSS helpers
├── prisma/                     # Database Schema & Migrations
│   ├── schema.prisma           # Complete PostgreSQL relational schema
│   ├── seed.ts                 # Production & development seeding script
│   └── migrations/             # Timestamped migration history
├── public/                     # Static assets, branding, and favicons
└── types/                      # Ambient & module TypeScript definitions
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **Database**: PostgreSQL 15+ (Local or [Neon](https://neon.tech/))
- **AWS Account**: S3 Bucket & SES credentials (optional for local mock testing)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amzetix/agency-os.git
   cd agency-os
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Populate your `.env` file with your database connection string and secrets).*

4. **Initialize and synchronize the database:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following configuration:

```env
# ─────────────────────────────────────────────────────────────────
# DATABASE (PostgreSQL / Neon Connection String)
# ─────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://username:password@ep-sample-pooler.neon.tech/neondb?sslmode=require"

# ─────────────────────────────────────────────────────────────────
# NEXTAUTH / AUTH.JS v5
# ─────────────────────────────────────────────────────────────────
AUTH_SECRET="your-32-byte-base64-secret"  # Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# ─────────────────────────────────────────────────────────────────
# EMAIL DISPATCH (Dual Mode: "smtp" or "ses")
# ─────────────────────────────────────────────────────────────────
EMAIL_PROVIDER="smtp"                     # Set to "ses" for Amazon SES
COMPANY_NAME="AMZETIX"

# Option A: SMTP (Gmail / Custom Mail Server)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="AMZETIX <your-email@gmail.com>"

# Option B: Amazon SES
AWS_SES_REGION="eu-north-1"
AWS_SES_ACCESS_KEY_ID="AKIA..."
AWS_SES_SECRET_ACCESS_KEY="..."

# ─────────────────────────────────────────────────────────────────
# STORAGE (AWS S3 / S3-Compatible Storage)
# ─────────────────────────────────────────────────────────────────
STORAGE_PROVIDER="s3"
AWS_S3_BUCKET="amzetix-app"
AWS_S3_REGION="eu-north-1"
AWS_S3_ACCESS_KEY_ID="AKIA..."
AWS_S3_SECRET_ACCESS_KEY="..."
AWS_S3_ENDPOINT=""                        # Leave empty for AWS S3, or specify for Cloudflare R2

# ─────────────────────────────────────────────────────────────────
# APPLICATION PUBLIC CONFIG
# ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="AMZETIX"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🗄️ Database Management

Amzetix -OS utilizes **Prisma ORM** with native PostgreSQL connection pooling.

```bash
# Push schema updates directly to the database (development)
npm run db:push

# Generate Prisma Client types
npm run db:generate

# Execute database migrations
npm run db:migrate

# Seed the database with core departments, leave types, and initial admin accounts
npm run db:seed

# Launch Prisma Studio web GUI to inspect records
npm run db:studio
```

---

## 🔒 Security & Authentication

- **Role-Based Access Control (RBAC)**: Distinct permissions for `OWNER`, `ADMIN`, `MANAGER`, `PROJECT_MANAGER`, `EMPLOYEE`, `ACCOUNTANT`, `HR`, and `CLIENT`.
- **Session Lifecycles**: JWT tokens configured with a strict 6-hour maximum age and automatic rolling validation during active periods.
- **Credential Protection**: Passwords hashed using `bcryptjs` with high salt rounds.
- **Audit Trails**: Critical system actions (invoicing, payroll dispatch, user creation, payment logs) are recorded in the `audit_logs` table with IP and User Agent tracking.

---

## 💻 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches Next.js dev server with Turbopack at `localhost:3000` |
| `npm run build` | Compiles and optimizes application for production deployment |
| `npm run start` | Boots the production Next.js server |
| `npm run lint` | Runs ESLint analysis across the project |
| `npm run db:push` | Synchronizes the Prisma schema with the live database |
| `npm run db:seed` | Seeds database with required core data and administrator credentials |
| `npm run db:studio` | Opens visual Prisma Studio database manager |
| `npm run test` | Executes test suites with Vitest |

---

## 🗺 Roadmap

- [x] Core ERP & Project Management Architecture
- [x] Client Portal with real-time milestone & billing visibility
- [x] Automated Payroll & Attendance with deduction calculations
- [x] S3 Cloud File Management with presigned downloads
- [x] Dual Email Provider Integration (SMTP & Amazon SES)
- [x] Neon Serverless PostgreSQL Database Connection
- [ ] Multi-tenant workspace partitioning
- [ ] WhatsApp & Slack webhook notification integrations
- [ ] AI-assisted sprint velocity & revenue forecasting
- [ ] Two-factor authentication (2FA / TOTP)

---

## 📄 License & Copyright

Copyright (c) 2026 **AMZETIX (Pvt) Ltd**. All rights reserved.

This software and its associated documentation are **proprietary and confidential**. Unauthorized copying, distribution, modification, public display, or deployment of this software, in whole or in part, via any medium is strictly prohibited without explicit prior written authorization from **AMZETIX**.

For enterprise licensing inquiries, contact: **licensing@amzetix.com**
