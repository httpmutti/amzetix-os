import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "invoices:edit")) redirect("/invoices");

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id, deletedAt: null },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!invoice) redirect("/invoices");
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") redirect(`/invoices/${id}`);

  return (
    <>
      <Header />
      <PageContainer>
        <div className="mb-4">
          <Link href={`/invoices/${id}`} className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft size={14} /> Back to Invoice
          </Link>
        </div>
        <PageHeader title={`Edit ${invoice.invoiceNumber}`} />
        <InvoiceForm invoice={{
          id: invoice.id,
          clientId: invoice.clientId,
          issueDate: invoice.issueDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          currency: invoice.currency,
          items: invoice.items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            service: item.service ?? "",
          })),
          discountType: invoice.discountType,
          discountValue: invoice.discountValue ? Number(invoice.discountValue) : 0,
          taxRate: invoice.taxRate ? Number(invoice.taxRate) : 0,
          paymentTerms: invoice.paymentTerms ?? 30,
          paymentLink: invoice.paymentLink,
          notes: invoice.notes,
          internalNotes: invoice.internalNotes,
        }} />
      </PageContainer>
    </>
  );
}
