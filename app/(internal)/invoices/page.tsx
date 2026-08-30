import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { InvoicesContent } from "@/components/invoices/InvoicesContent";
import type { UserRole } from "@prisma/client";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const canCreate = hasPermission(role, "invoices:create");
  const canEdit = hasPermission(role, "invoices:edit");
  const canDelete = hasPermission(role, "invoices:delete");
  const canSend = hasPermission(role, "invoices:send");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Invoices" description="Create and manage client invoices." />
        <InvoicesContent canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} canSend={canSend} />
      </PageContainer>
    </>
  );
}
