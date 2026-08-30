import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${firstName}. Here's what's happening.`}
        />
        <DashboardContent />
      </PageContainer>
    </>
  );
}
