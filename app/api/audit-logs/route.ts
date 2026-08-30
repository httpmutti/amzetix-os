import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(session.user.role, "audit:view"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const action = searchParams.get("action") ?? undefined;
  const entity = searchParams.get("entity") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const exportCsv = searchParams.get("export") === "csv";

  const where = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(userId ? { performedById: userId } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59Z") } : {}),
          },
        }
      : {}),
    ...(search ? { description: { contains: search, mode: "insensitive" as const } } : {}),
  };

  if (exportCsv) {
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { performedBy: { select: { name: true, email: true } } },
    });

    const header = "Date,User,Action,Entity,Entity ID,Description";
    const lines = rows.map((r) => {
      const date = r.createdAt.toISOString();
      const user = `"${r.performedBy.name ?? r.performedBy.email}"`;
      const desc = `"${r.description.replace(/"/g, '""')}"`;
      return [date, user, r.action, r.entity, r.entityId ?? "", desc].join(",");
    });
    const csv = [header, ...lines].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const skip = (page - 1) * PAGE_SIZE;
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: { performedBy: { select: { name: true, email: true, image: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    data,
    meta: { total, page, pageSize: PAGE_SIZE, pageCount: Math.ceil(total / PAGE_SIZE) },
  });
}
