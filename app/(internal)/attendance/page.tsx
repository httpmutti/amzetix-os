import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { AttendanceContent } from "@/components/attendance/AttendanceContent";
import type { UserRole } from "@prisma/client";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "attendance:view_own")) redirect("/dashboard");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Attendance" description="Track daily check-ins and monthly attendance" />
        <AttendanceContent
          canViewAll={hasPermission(role, "attendance:view_all")}
          canCheckIn={hasPermission(role, "attendance:checkin")}
        />
      </PageContainer>
    </>
  );
}
