import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendPortalInviteEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

const schema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "clients:edit"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { clientId, email, name } = parsed.data;

  const client = await prisma.client.findUnique({ where: { id: clientId, deletedAt: null } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existing = await prisma.clientUser.findUnique({ where: { userId: existingUser.id } });
    if (existing) return NextResponse.json({ error: "This user already has portal access" }, { status: 409 });

    await prisma.$transaction([
      prisma.clientUser.create({ data: { userId: existingUser.id, clientId } }),
      ...(existingUser.role !== "CLIENT"
        ? [prisma.user.update({ where: { id: existingUser.id }, data: { role: "CLIENT" } })]
        : []),
    ]);
    return NextResponse.json({ data: { email: existingUser.email, note: "Existing user linked to portal" } });
  }

  const tempPassword = Math.random().toString(36).slice(-10);
  const hashed = await bcrypt.hash(tempPassword, 10);

  const newUser = await prisma.user.create({
    data: { email, name, password: hashed, role: "CLIENT" },
  });
  await prisma.clientUser.create({ data: { userId: newUser.id, clientId } });

  const companyName = process.env.COMPANY_NAME ?? "Amzetix -OS";
  const portalUrl = `${process.env.NEXTAUTH_URL ?? ""}/portal`;
  sendPortalInviteEmail(
    { companyName, clientName: client.companyName, recipientName: name, email, temporaryPassword: tempPassword, portalUrl },
    email,
  ).catch((err) => console.error("[email] portal invite failed:", err));

  return NextResponse.json({ data: { id: newUser.id, email, name, tempPassword } }, { status: 201 });
}
