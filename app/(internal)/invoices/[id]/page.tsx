import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { InvoiceDetail } from "@/components/invoices/InvoiceDetail";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const canEdit = hasPermission(role, "invoices:edit");
  const canDelete = hasPermission(role, "invoices:delete");
  const canSend = hasPermission(role, "invoices:send");
  const canRecordPayment = hasPermission(role, "payments:create");

  const { id } = await params;

  return (
    <>
      <Header />
      <PageContainer>
        <div className="mb-4">
          <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft size={14} /> Back to Invoices
          </Link>
        </div>
        <InvoiceDetail invoiceId={id} canEdit={canEdit} canDelete={canDelete} canSend={canSend} canRecordPayment={canRecordPayment} />
      </PageContainer>
    </>
  );
}
