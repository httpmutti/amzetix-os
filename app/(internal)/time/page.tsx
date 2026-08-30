import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { TimeContent } from "@/components/time/TimeContent";
import type { UserRole } from "@prisma/client";

export default async function TimePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const canTrack = hasPermission(role, "time:track");
  const canAdmin = hasPermission(role, "team:view");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader
          title="Time Tracker"
          description="Track time entries, monitor active employees, and review weekly hours."
        />
        <TimeContent canTrack={canTrack} canAdmin={canAdmin} />
      </PageContainer>
    </>
  );
}
