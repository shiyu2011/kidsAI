import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const accessToken = request.nextUrl.searchParams.get("token");
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "Token required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const session = await prisma.session.findUnique({
    where: { accessToken },
    select: {
      id: true,
      topic: true,
      endedAt: true,
      turns: {
        select: { role: true, content: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      topic: session.topic,
      ended: !!session.endedAt,
      messages: session.turns.map((t) => ({
        role: t.role === "kid" ? "kid" : "ai",
        content: t.content,
      })),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
