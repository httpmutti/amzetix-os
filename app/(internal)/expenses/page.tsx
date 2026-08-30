import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ExpensesContent } from "@/components/expenses/ExpensesContent";
import type { UserRole } from "@prisma/client";

export default async function ExpensesPage() {
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
        <PageHeader title="Expenses" description="Track business expenses and spending by category." />
        <ExpensesContent canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
      </PageContainer>
    </>
  );
}
