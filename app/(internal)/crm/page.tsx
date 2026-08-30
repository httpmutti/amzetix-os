import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { CRMContent } from "@/components/crm/CRMContent";
import type { UserRole } from "@prisma/client";

export default async function CRMPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const canDelete = hasPermission(role, "crm:delete");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader
          title="CRM / Leads"
          description="Manage your lead pipeline and track opportunities."
        />
        <CRMContent canDelete={canDelete} />
      </PageContainer>
    </>
  );
}
