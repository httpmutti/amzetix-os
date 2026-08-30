import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { PaymentsContent } from "@/components/payments/PaymentsContent";
import type { UserRole } from "@prisma/client";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const canCreate = hasPermission(role, "payments:create");
  const canDelete = hasPermission(role, "payments:delete");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Payments" description="Track all recorded payments across invoices." />
        <PaymentsContent canCreate={canCreate} canDelete={canDelete} />
      </PageContainer>
    </>
  );
}
