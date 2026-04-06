import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentId } from "@/lib/auth-middleware";

const TOPIC_CATEGORIES: Record<string, RegExp> = {
  math: /\b(math|number|fraction|algebra|geometry|equation|calculat|multiply|divide|add|subtract|percent|\d\s*[+\-*/÷×=]\s*\d)\b/i,
  science: /\b(science|planet|space|animal|plant|gravity|light|energy|atom|cell|weather|photosynthes|biology|chemistry|physics|earth|moon|sun|star|ocean)\b/i,
  creative: /\b(story|poem|song|write|character|dragon|adventure|imagine|fiction|fairy|tale|hero|villain|magic)\b/i,
  coding: /\b(code|program|bug|function|website|app|game|python|javascript|html|css|computer|robot|algorithm)\b/i,
};

function categorizeTopic(topic: string): string {
  for (const [category, pattern] of Object.entries(TOPIC_CATEGORIES)) {
    if (pattern.test(topic)) return category;
  }
  return "exploration";
}

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

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Total sessions
  const totalSessions = sessions.length;
  const weekSessions = sessions.filter(s => new Date(s.startedAt) >= oneWeekAgo).length;

  // Compute per-session effort stats
  const sessionStats = sessions.map(s => {
    const kidTurns = s.turns.filter(t => t.role === "kid");
    const avgEffort = kidTurns.length > 0
      ? kidTurns.reduce((sum, t) => sum + t.effortScore, 0) / kidTurns.length
      : 0;
    const firstKid = kidTurns[0];
    const lastKid = kidTurns[kidTurns.length - 1];
    return {
      sessionId: s.id,
      topic: s.topic || "Untitled",
      date: s.startedAt,
      endedAt: s.endedAt,
      childName: s.child.displayName,
      turnCount: kidTurns.length,
      avgEffort: Math.round(avgEffort * 10) / 10,
      firstMessage: firstKid?.content || "",
      lastMessage: lastKid?.content || "",
      firstEffort: firstKid?.effortScore || 0,
      lastEffort: lastKid?.effortScore || 0,
      improved: kidTurns.length >= 2 && (lastKid?.effortScore || 0) > (firstKid?.effortScore || 0),
      breakthroughs: kidTurns.filter(t => t.effortScore >= 3).length,
    };
  });

  // Average effort this week vs last week
  const thisWeekSessions = sessionStats.filter(s => new Date(s.date) >= oneWeekAgo);
  const lastWeekSessions = sessionStats.filter(s => {
    const d = new Date(s.date);
    return d >= twoWeeksAgo && d < oneWeekAgo;
  });

  const avgEffort = thisWeekSessions.length > 0
    ? Math.round(thisWeekSessions.reduce((s, x) => s + x.avgEffort, 0) / thisWeekSessions.length * 10) / 10
    : sessionStats.length > 0
      ? Math.round(sessionStats.reduce((s, x) => s + x.avgEffort, 0) / sessionStats.length * 10) / 10
      : 0;

  const avgEffortLastWeek = lastWeekSessions.length > 0
    ? Math.round(lastWeekSessions.reduce((s, x) => s + x.avgEffort, 0) / lastWeekSessions.length * 10) / 10
    : 0;

  // Streak: consecutive days with sessions (counting back from today)
  const sessionDates = new Set(
    sessions.map(s => new Date(s.startedAt).toISOString().split("T")[0])
  );
  let streak = 0;
  const checkDate = new Date(now);
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (sessionDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Total breakthroughs
  const totalBreakthroughs = sessionStats.reduce((s, x) => s + x.breakthroughs, 0);
  const weekBreakthroughs = sessionStats
    .filter(s => new Date(s.date) >= oneWeekAgo)
    .reduce((sum, x) => sum + x.breakthroughs, 0);

  // Effort trend (per session, chronological)
  const effortTrend = [...sessionStats]
    .reverse()
    .map(s => ({
      date: new Date(s.date).toISOString().split("T")[0],
      avgEffort: s.avgEffort,
      topic: s.topic,
    }));

  // Recent highlights (top 3 most recent with turns)
  const recentHighlights = sessionStats
    .filter(s => s.turnCount > 0)
    .slice(0, 3)
    .map(s => ({
      sessionId: s.sessionId,
      topic: s.topic,
      date: new Date(s.date).toISOString().split("T")[0],
      avgEffort: s.avgEffort,
      firstMessage: s.firstMessage.slice(0, 120),
      lastMessage: s.lastMessage.slice(0, 120),
      improved: s.improved,
    }));

  // Topic breakdown
  const topicCounts: Record<string, number> = {};
  for (const s of sessionStats) {
    const cat = categorizeTopic(s.topic);
    topicCounts[cat] = (topicCounts[cat] || 0) + 1;
  }
  const topicBreakdown = Object.entries(topicCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    totalSessions,
    weekSessions,
    avgEffort,
    avgEffortLastWeek,
    streak,
    totalBreakthroughs,
    weekBreakthroughs,
    effortTrend,
    recentHighlights,
    topicBreakdown,
  });
}
