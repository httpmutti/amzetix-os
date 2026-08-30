import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { UserRole } from "@prisma/client";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (role === "CLIENT") redirect("/portal");

  return (
    <DashboardShell
      role={role}
      userName={session.user.name ?? session.user.email ?? "User"}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image}
    >
      {children}
    </DashboardShell>
  );
}
