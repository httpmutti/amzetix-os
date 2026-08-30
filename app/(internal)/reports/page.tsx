import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ReportsContent } from "@/components/reports/ReportsContent";
import type { UserRole } from "@prisma/client";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "reports:view")) redirect("/dashboard");

  const canExport = hasPermission(role, "reports:export");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Reports" description="Generate and export pre-built reports across all modules." />
        <ReportsContent canExport={canExport} />
      </PageContainer>
    </>
  );
}
