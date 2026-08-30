import { prisma } from "@/lib/prisma";

export async function getPortalClient(userId: string) {
  return prisma.clientUser.findUnique({
    where: { userId },
    include: {
      client: { select: { id: true, companyName: true, status: true } },
    },
  });
}
