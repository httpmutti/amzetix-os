import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const userId = session.user.id;
    if (!userId) return NextResponse.json({ error: "Session missing user id" }, { status: 401 });

    const clientUser = await prisma.clientUser.findUnique({ where: { userId } });
    if (!clientUser) return NextResponse.json({ error: "No portal access" }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { projectId, content } = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: clientUser.clientId, deletedAt: null },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const comment = await prisma.projectComment.create({
      data: { projectId, userId, content, visibility: "CLIENT_VISIBLE" },
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (err) {
    console.error("[portal/comments POST]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
