import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmployeeDetail } from "@/components/team/EmployeeDetail";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "team:view")) redirect("/dashboard");

  const { id } = await params;

  return (
    <>
      <Header />
      <PageContainer>
        <div className="mb-4">
          <Link href="/team" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft size={14} /> Back to Team
          </Link>
        </div>
        <EmployeeDetail
          employeeId={id}
          canEdit={hasPermission(role, "team:edit")}
          canViewSalary={hasPermission(role, "team:view_salary")}
        />
      </PageContainer>
    </>
  );
}
