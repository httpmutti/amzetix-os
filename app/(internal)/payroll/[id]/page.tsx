import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { PayrollDetail } from "@/components/payroll/PayrollDetail";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "payroll:view_all")) redirect("/dashboard");

  const canEdit = hasPermission(role, "payroll:edit");
  const canApprove = hasPermission(role, "payroll:approve");
  const canDelete = hasPermission(role, "payroll:create");

  const { id } = await params;

  return (
    <>
      <Header />
      <PageContainer>
        <div className="mb-4">
          <Link href="/payroll" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft size={14} /> Back to Payroll
          </Link>
        </div>
        <PayrollDetail payrollId={id} canEdit={canEdit} canApprove={canApprove} canDelete={canDelete} />
      </PageContainer>
    </>
  );
}
