import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentId } from "@/lib/auth-middleware";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const parentId = await getParentId(request);
  if (!parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const childId = request.nextUrl.searchParams.get("childId");

  const sessions = await prisma.session.findMany({
    where: {
      child: { parentId },
      ...(childId ? { childId } : {}),
    },
    include: {
      child: { select: { displayName: true } },
      turns: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { startedAt: "desc" },
  });

  // Strip accessToken from response — parents don't need it in the dashboard
  const sanitized = sessions.map(({ accessToken: _token, ...rest }) => rest);
  return NextResponse.json(sanitized);
}

export async function POST(request: NextRequest) {
  const parentId = await getParentId(request);
  if (!parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { childId } = await request.json();

    // Verify child belongs to this parent
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found" },
        { status: 404 }
      );
    }

    const accessToken = crypto.randomBytes(32).toString("hex");

    const session = await prisma.session.create({
      data: { childId, accessToken },
    });

    return NextResponse.json(
      { sessionId: session.id, accessToken },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
