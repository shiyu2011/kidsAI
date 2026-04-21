import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminId } from "@/lib/admin-middleware";

export async function GET(request: NextRequest) {
  const adminId = await getAdminId(request);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parents = await prisma.parent.findMany({
    select: {
      id: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      children: {
        select: {
          id: true,
          displayName: true,
          createdAt: true,
          sessions: {
            select: {
              id: true,
              topic: true,
              startedAt: true,
              endedAt: true,
              turns: {
                select: {
                  id: true,
                  role: true,
                  effortScore: true,
                  createdAt: true,
                },
              },
            },
            orderBy: { startedAt: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute summary stats
  const summary = parents.map((parent) => {
    const allSessions = parent.children.flatMap((c) => c.sessions);
    const allTurns = allSessions.flatMap((s) => s.turns);
    const kidTurns = allTurns.filter((t) => t.role === "kid");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = allSessions.filter(
      (s) => new Date(s.startedAt) >= today
    ).length;

    const avgEffort =
      kidTurns.length > 0
        ? Math.round(
            (kidTurns.reduce((sum, t) => sum + t.effortScore, 0) /
              kidTurns.length) *
              10
          ) / 10
        : 0;

    const lastActive =
      allTurns.length > 0
        ? allTurns.reduce((latest, t) =>
            new Date(t.createdAt) > new Date(latest.createdAt) ? t : latest
          ).createdAt
        : null;

    return {
      id: parent.id,
      email: parent.email,
      isAdmin: parent.isAdmin,
      createdAt: parent.createdAt,
      childCount: parent.children.length,
      totalSessions: allSessions.length,
      todaySessions,
      totalMessages: allTurns.length,
      kidMessages: kidTurns.length,
      avgEffort,
      lastActive,
      children: parent.children.map((child) => {
        const childKidTurns = child.sessions
          .flatMap((s) => s.turns)
          .filter((t) => t.role === "kid");
        const childAvg =
          childKidTurns.length > 0
            ? Math.round(
                (childKidTurns.reduce((sum, t) => sum + t.effortScore, 0) /
                  childKidTurns.length) *
                  10
              ) / 10
            : 0;

        return {
          id: child.id,
          displayName: child.displayName,
          sessionCount: child.sessions.length,
          messageCount: childKidTurns.length,
          avgEffort: childAvg,
          recentTopics: child.sessions
            .slice(0, 5)
            .map((s) => s.topic)
            .filter(Boolean),
        };
      }),
    };
  });

  // Global stats
  const totalParents = parents.length;
  const totalChildren = parents.reduce((s, p) => s + p.children.length, 0);
  const totalSessions = summary.reduce((s, p) => s + p.totalSessions, 0);
  const totalMessages = summary.reduce((s, p) => s + p.kidMessages, 0);
  const todaySessionsTotal = summary.reduce((s, p) => s + p.todaySessions, 0);

  return NextResponse.json({
    global: {
      totalParents,
      totalChildren,
      totalSessions,
      totalMessages,
      todaySessions: todaySessionsTotal,
    },
    parents: summary,
  });
}
