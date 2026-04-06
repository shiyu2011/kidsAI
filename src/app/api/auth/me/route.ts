import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentId } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const parentId = await getParentId(request);
  if (!parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    select: { id: true, email: true, createdAt: true },
  });

  if (!parent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(parent);
}
