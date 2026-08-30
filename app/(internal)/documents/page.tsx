import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { DocumentsContent } from "@/components/documents/DocumentsContent";
import type { UserRole } from "@prisma/client";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "documents:view")) redirect("/dashboard");

  const canUpload = hasPermission(role, "documents:upload");
  const canDelete = hasPermission(role, "documents:delete");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Documents" description="Upload and manage files across clients, projects, employees and invoices." />
        <DocumentsContent canUpload={canUpload} canDelete={canDelete} />
      </PageContainer>
    </>
  );
}
