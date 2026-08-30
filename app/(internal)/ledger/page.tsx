import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { LedgerContent } from "@/components/ledger/LedgerContent";
import type { UserRole } from "@prisma/client";

export default async function LedgerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const canCreate = hasPermission(role, "expenses:create");
  const canEdit = hasPermission(role, "expenses:edit");
  const canDelete = hasPermission(role, "expenses:delete");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader
          title="Ledger Book"
          description="Track loans, borrowings, and repayments. Monitor outstanding debt and repayment progress."
        />
        <LedgerContent canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
      </PageContainer>
    </>
  );
}
