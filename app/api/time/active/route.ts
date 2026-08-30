import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveEntry } from "@/services/time.service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const emp = await prisma.employee.findFirst({ where: { userId: session.user.id! } });
  if (!emp) return NextResponse.json({ data: null });

  const entry = await getActiveEntry(emp.id);
  return NextResponse.json({ data: entry });
}
