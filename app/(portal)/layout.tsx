import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portal";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  const cp = await getPortalClient(session.user.id);
  if (!cp) redirect("/login");

  return (
    <PortalShell
      userName={session.user.name ?? "Client"}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image}
      companyName={cp.client.companyName}
    >
      <PortalHeader />
      <PageContainer>
        {children}
      </PageContainer>
    </PortalShell>
  );
}
