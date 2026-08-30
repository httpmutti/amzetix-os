import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { PayrollContent } from "@/components/payroll/PayrollContent";
import type { UserRole } from "@prisma/client";

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:view_all")) redirect("/dashboard");

  const canCreate = hasPermission(role, "payroll:create");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Payroll" description="Monthly payroll runs and employee salary management." />
        <PayrollContent canCreate={canCreate} />
      </PageContainer>
    </>
  );
}
