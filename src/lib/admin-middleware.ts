import { verifyToken } from "./auth";
import { prisma } from "./db";
import { NextRequest } from "next/server";

export async function getAdminId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  if (!payload?.parentId) return null;

  const parent = await prisma.parent.findUnique({
    where: { id: payload.parentId },
    select: { isAdmin: true },
  });

  if (!parent?.isAdmin) return null;
  return payload.parentId;
}
