import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { LeaveContent } from "@/components/leave/LeaveContent";
import type { UserRole } from "@prisma/client";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "leave:view_own")) redirect("/dashboard");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Leave" description="Request time off and manage leave approvals" />
        <LeaveContent
          canViewAll={hasPermission(role, "leave:view_all")}
          canApprove={hasPermission(role, "leave:approve")}
        />
      </PageContainer>
    </>
  );
}
