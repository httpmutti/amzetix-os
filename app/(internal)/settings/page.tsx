import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { SettingsContent } from "@/components/settings/SettingsContent";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasPermission(session.user.role, "settings:view")) redirect("/dashboard");

  const rows = await prisma.companySetting.findMany();
  const initialSettings: Record<string, unknown> = {};
  for (const row of rows) {
    initialSettings[row.key] = row.value;
  }

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader title="Settings" />
        <SettingsContent initialSettings={initialSettings} userRole={session.user.role} />
      </PageContainer>
    </>
  );
}
