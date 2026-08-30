import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { RevenueContent } from "@/components/revenue/RevenueContent";
import type { UserRole } from "@prisma/client";

export default async function RevenuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "revenue:view")) redirect("/dashboard");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Revenue & P&L" description="Profit & Loss overview, expense breakdown, and withdrawals." />
        <RevenueContent />
      </PageContainer>
    </>
  );
}
