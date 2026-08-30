import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role as UserRole, "team:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const employees = await prisma.employee.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    take: limit,
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      position: true,
      profileImage: true,
      status: true,
      department: { select: { id: true, name: true } },
      user: { select: { email: true } },
    },
  });

  return NextResponse.json({ data: employees });
}
