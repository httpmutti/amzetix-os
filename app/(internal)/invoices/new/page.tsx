import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "invoices:create")) redirect("/invoices");

  return (
    <>
      <Header />
      <PageContainer>
        <div className="mb-4">
          <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft size={14} /> Back to Invoices
          </Link>
        </div>
        <PageHeader title="New Invoice" description="Create a new invoice for a client." />
        <InvoiceForm />
      </PageContainer>
    </>
  );
}
