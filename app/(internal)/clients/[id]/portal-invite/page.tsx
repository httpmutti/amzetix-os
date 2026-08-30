import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { PortalInviteModal } from "@/components/portal/PortalInviteModal";
import Link from "next/link";
import type { UserRole } from "@prisma/client";

export default async function PortalInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "clients:edit")) redirect(`/clients/${id}`);

  const client = await prisma.client.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      companyName: true,
      clientUsers: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  if (!client) redirect("/clients");

  return (
    <>
      <Header />
      <PageContainer>
        <PageHeader
          title={`Portal Access — ${client.companyName}`}
          description="Grant client contacts access to view their projects and invoices."
        />

        <div className="grid gap-8 max-w-xl">
          {/* Existing portal users */}
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
              Current Portal Users
            </h2>
            {client.clientUsers.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No portal users yet. Invite someone below.
              </p>
            ) : (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
                <table className="w-full text-sm">
                  <thead style={{ background: "var(--surface-page)" }}>
                    <tr>
                      {["Name", "Email"].map(h => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ background: "var(--surface-card)" }}>
                    {client.clientUsers.map(cu => (
                      <tr key={cu.id} className="border-t" style={{ borderColor: "var(--border-default)" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                          {cu.user.name}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                          {cu.user.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invite button */}
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
              Invite New Contact
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              A portal account will be created for the contact. Share the generated temporary password securely — there is no automated email.
            </p>
            <PortalInviteModal clientId={client.id} />
          </div>

          <Link href={`/clients/${id}`} className="text-sm" style={{ color: "var(--color-accent)" }}>
            ← Back to {client.companyName}
          </Link>
        </div>
      </PageContainer>
    </>
  );
}
