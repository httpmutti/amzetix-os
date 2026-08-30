import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.record(z.string(), z.unknown());

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role, "settings:view"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.companySetting.findMany();
  const data: Record<string, unknown> = {};
  for (const row of rows) {
    data[row.key] = row.value;
  }
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role, "settings:edit"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updates = parsed.data;
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.companySetting.upsert({
        where: { key },
        update: { value: value as object },
        create: { key, value: value as object },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
