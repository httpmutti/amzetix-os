import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ClientsContent } from "@/components/clients/ClientsContent";
import type { UserRole } from "@prisma/client";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const canDelete = hasPermission(role, "clients:delete");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader
          title="Clients"
          description="Manage your client relationships and accounts."
        />
        <ClientsContent canDelete={canDelete} />
      </PageContainer>
    </>
  );
}
