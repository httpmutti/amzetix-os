import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { TasksContent } from "@/components/tasks/TasksContent";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const emp = await prisma.employee.findFirst({ where: { userId: session.user.id! } });

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader
          title="Tasks"
          description="Manage your team's tasks and track progress."
        />
        <TasksContent
          canCreate={hasPermission(role, "tasks:create")}
          myEmployeeId={emp?.id}
        />
      </PageContainer>
    </>
  );
}
