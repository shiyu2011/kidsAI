import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentId } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const parentId = await getParentId(request);
  if (!parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const children = await prisma.childProfile.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(children);
}

export async function POST(request: NextRequest) {
  const parentId = await getParentId(request);
  if (!parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { displayName } = await request.json();

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    const child = await prisma.childProfile.create({
      data: { parentId, displayName: displayName.trim() },
    });

    return NextResponse.json(child, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
