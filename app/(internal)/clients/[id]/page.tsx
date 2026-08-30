import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { ClientDetail } from "@/components/clients/ClientDetail";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { UserRole } from "@prisma/client";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  const canEdit = hasPermission(role, "clients:edit");

  const { id } = await params;

  return (
    <>
      <Header />
      <PageContainer>
        <div className="mb-4">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronLeft size={14} />
            Back to Clients
          </Link>
        </div>
        <ClientDetail clientId={id} canEdit={canEdit} />
      </PageContainer>
    </>
  );
}
