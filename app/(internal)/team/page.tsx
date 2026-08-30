import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { TeamContent } from "@/components/team/TeamContent";
import type { UserRole } from "@prisma/client";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "team:view")) redirect("/dashboard");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Team" description="Manage employees, roles, and departments" />
        <TeamContent
          canCreate={hasPermission(role, "team:create")}
          canEdit={hasPermission(role, "team:edit")}
          canDelete={hasPermission(role, "team:delete")}
          canViewSalary={hasPermission(role, "team:view_salary")}
        />
      </PageContainer>
    </>
  );
}
