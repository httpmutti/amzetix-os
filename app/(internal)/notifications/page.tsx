import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { NotificationsContent } from "@/components/notifications/NotificationsContent";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Notifications" />
        <NotificationsContent />
      </PageContainer>
    </>
  );
}
