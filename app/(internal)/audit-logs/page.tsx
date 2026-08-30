import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AuditLogsContent } from "@/components/audit/AuditLogsContent";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.role, "audit:view")) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Audit Logs" />
        <AuditLogsContent users={users} />
      </PageContainer>
    </>
  );
}
