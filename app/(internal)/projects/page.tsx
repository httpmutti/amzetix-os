import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ProjectsContent } from "@/components/projects/ProjectsContent";
import type { UserRole } from "@prisma/client";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader
          title="Projects"
          description="Track all your client projects and deliverables."
        />
        <ProjectsContent
          canCreate={hasPermission(role, "projects:create")}
          canDelete={hasPermission(role, "projects:delete")}
        />
      </PageContainer>
    </>
  );
}
