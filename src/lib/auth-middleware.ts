import { verifyToken } from "./auth";
import { NextRequest } from "next/server";

export async function getParentId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  return payload?.parentId ?? null;
}
