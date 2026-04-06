"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getChildren,
  createChild,
  getSessions,
  createSession,
  isLoggedIn,
  clearToken,
} from "@/lib/api-client";

interface Child {
  id: string;
  displayName: string;
  createdAt: string;
}

interface Turn {
  id: string;
  role: string;
  content: string;
  effortScore: number;
  createdAt: string;
}

interface Session {
  id: string;
  childId: string;
  topic: string | null;
  accessToken: string;
  startedAt: string;
  endedAt: string | null;
  child: { displayName: string };
  turns: Turn[];
}

interface DashboardStats {
  totalSessions: number;
  weekSessions: number;
  avgEffort: number;
  avgEffortLastWeek: number;
  streak: number;
  totalBreakthroughs: number;
  weekBreakthroughs: number;
  effortTrend: { date: string; avgEffort: number; topic: string }[];
  recentHighlights: {
    sessionId: string;
    topic: string;
    date: string;
    avgEffort: number;
    firstMessage: string;
    lastMessage: string;
    improved: boolean;
  }[];
  topicBreakdown: { category: string; count: number }[];
}

const TOPIC_COLORS: Record<string, { bg: string; text: string }> = {
  science: { bg: "bg-blue-100", text: "text-blue-700" },
  math: { bg: "bg-amber-100", text: "text-amber-700" },
  creative: { bg: "bg-pink-100", text: "text-pink-700" },
  coding: { bg: "bg-emerald-100", text: "text-emerald-700" },
  exploration: { bg: "bg-purple-100", text: "text-purple-700" },
};

function effortStars(avg: number): string {
  if (avg >= 2.5) return "\u2605\u2605\u2605";
  if (avg >= 1.5) return "\u2605\u2605";
  if (avg >= 0.5) return "\u2605";
  return "";
}

function TrendChart({ data }: { data: { date: string; avgEffort: number; topic: string }[] }) {
  if (data.length === 0) return null;

  const width = 900;
  const height = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    y: padding.top + chartH - (d.avgEffort / 3) * chartH,
    label: d.date.slice(5),
    effort: d.avgEffort,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
      {/* Zone backgrounds */}
      <rect x={padding.left} y={padding.top} width={chartW} height={chartH / 3} fill="rgba(22,163,74,0.05)" />
      <rect x={padding.left} y={padding.top + chartH / 3} width={chartW} height={chartH / 3} fill="rgba(234,179,8,0.05)" />
      <rect x={padding.left} y={padding.top + (chartH * 2) / 3} width={chartW} height={chartH / 3} fill="rgba(220,38,38,0.05)" />

      {/* Zone lines */}
      <line x1={padding.left} y1={padding.top + chartH / 3} x2={width - padding.right} y2={padding.top + chartH / 3} stroke="#e5e7eb" strokeDasharray="4" />
      <line x1={padding.left} y1={padding.top + (chartH * 2) / 3} x2={width - padding.right} y2={padding.top + (chartH * 2) / 3} stroke="#e5e7eb" strokeDasharray="4" />

      {/* Zone labels */}
      <text x={width - padding.right - 4} y={padding.top + chartH / 6 + 4} textAnchor="end" fontSize="10" fill="#bbb">Great</text>
      <text x={width - padding.right - 4} y={padding.top + chartH / 2 + 4} textAnchor="end" fontSize="10" fill="#bbb">Trying</text>
      <text x={width - padding.right - 4} y={padding.top + (chartH * 5) / 6 + 4} textAnchor="end" fontSize="10" fill="#bbb">Lazy</text>

      {/* Line */}
      {points.length > 1 && (
        <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      )}

      {/* Dots and labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#2563eb" />
          <text x={p.x} y={height - 5} textAnchor="middle" fontSize="10" fill="#888">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [newChildName, setNewChildName] = useState("");
  const [showAddChild, setShowAddChild] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem("kidsai_token");
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      const [childrenData, sessionsData, statsData] = await Promise.all([
        getChildren(),
        getSessions(selectedChild || undefined),
        fetch(`/api/dashboard/stats${selectedChild ? `?childId=${selectedChild}` : ""}`, { headers }).then((r) => r.json()),
      ]);
      setChildren(childrenData);
      setSessions(sessionsData);
      setStats(statsData);
    } catch {
      clearToken();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [selectedChild, router]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [loadData, router]);

  async function handleAddChild() {
    if (!newChildName.trim()) return;
    await createChild(newChildName.trim());
    setNewChildName("");
    setShowAddChild(false);
    loadData();
  }

  async function handleStartSession(childId: string) {
    const { accessToken } = await createSession(childId);
    window.open(`/chat/${accessToken}`, "_blank");
    loadData();
  }

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  // Session detail view
  if (selectedSession) {
    const kidTurns = selectedSession.turns.filter((t) => t.role === "kid");
    const firstKid = kidTurns[0];
    const lastKid = kidTurns[kidTurns.length - 1];
    const hasBeforeAfter = kidTurns.length >= 2;

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => setSelectedSession(null)}
            className="text-blue-600 hover:underline text-sm mb-2 block"
          >
            &larr; Back to dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {selectedSession.child.displayName}&apos;s Session
          </h1>
          <p className="text-sm text-gray-500">
            {selectedSession.topic || "Untitled"} &middot;{" "}
            {new Date(selectedSession.startedAt).toLocaleDateString()}
          </p>
        </header>

        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {hasBeforeAfter && (
            <div className="bg-gradient-to-r from-orange-50 to-green-50 border border-orange-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thinking Transformation</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-orange-600 uppercase tracking-wider">First question</span>
                  <p className="text-gray-700 bg-white rounded-lg p-3 mt-1 border border-orange-200">
                    &quot;{firstKid.content}&quot;
                  </p>
                </div>
                <div className="text-center text-gray-400">&darr;</div>
                <div>
                  <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Last question</span>
                  <p className="text-gray-700 bg-white rounded-lg p-3 mt-1 border border-green-200">
                    &quot;{lastKid.content}&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Full Conversation</h3>
            <div className="space-y-3">
              {selectedSession.turns.map((turn) => (
                <div key={turn.id} className={`flex ${turn.role === "kid" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    turn.role === "kid" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-900"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs opacity-70">{turn.role === "kid" ? "Kid" : "SeanSean"}</span>
                      {turn.role === "kid" && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          turn.effortScore >= 2 ? "bg-green-500/20 text-green-100"
                          : turn.effortScore >= 1 ? "bg-yellow-500/20 text-yellow-100"
                          : "bg-red-500/20 text-red-100"
                        }`}>
                          {turn.effortScore >= 2 ? "Strong effort" : turn.effortScore >= 1 ? "Trying" : "Needs coaching"}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{turn.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const effortDelta = stats ? Math.round((stats.avgEffort - stats.avgEffortLastWeek) * 10) / 10 : 0;

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">kidsAI</h1>
          <p className="text-sm text-gray-500">Parent Dashboard</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">Log out</button>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Child tabs + add child */}
        <div className="flex items-center gap-2 flex-wrap">
          {children.length > 1 && (
            <button
              onClick={() => setSelectedChild(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                !selectedChild ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              All
            </button>
          )}
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(selectedChild === child.id ? null : child.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                selectedChild === child.id ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {child.displayName}
            </button>
          ))}
          <button
            onClick={() => setShowAddChild(true)}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            + Add Child
          </button>
          {selectedChild && (
            <button
              onClick={() => handleStartSession(selectedChild)}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition ml-auto"
            >
              Start Session
            </button>
          )}
        </div>

        {showAddChild && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-2">
            <input
              type="text"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="Child's first name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              onKeyDown={(e) => e.key === "Enter" && handleAddChild()}
              autoFocus
            />
            <button onClick={handleAddChild} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add</button>
            <button onClick={() => setShowAddChild(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
          </div>
        )}

        {children.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">?</div>
            <p className="text-gray-500 mb-2">Add your child to get started.</p>
            <p className="text-gray-400 text-sm">Only a first name is needed — no personal info collected.</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            {stats && stats.totalSessions > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sessions</div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalSessions}</div>
                  <div className="text-xs text-green-600 mt-1">+{stats.weekSessions} this week</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Effort</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.avgEffort}<span className="text-lg text-gray-400">/3</span>
                  </div>
                  {effortDelta !== 0 && (
                    <div className={`text-xs mt-1 ${effortDelta > 0 ? "text-green-600" : "text-red-500"}`}>
                      {effortDelta > 0 ? "\u25B2" : "\u25BC"} {Math.abs(effortDelta)} vs last week
                    </div>
                  )}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Streak</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.streak}<span className="text-lg text-gray-400"> days</span>
                  </div>
                  {stats.streak >= 3 && <div className="text-xs text-green-600 mt-1">On fire!</div>}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Breakthroughs</div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalBreakthroughs}</div>
                  {stats.weekBreakthroughs > 0 && (
                    <div className="text-xs text-green-600 mt-1">+{stats.weekBreakthroughs} this week</div>
                  )}
                </div>
              </div>
            )}

            {/* Thinking Trend Chart */}
            {stats && stats.effortTrend.length > 1 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Thinking Trend</h2>
                <TrendChart data={stats.effortTrend} />
              </div>
            )}

            {/* Recent Highlights */}
            {stats && stats.recentHighlights.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Highlights</h2>
                <div className="space-y-4">
                  {stats.recentHighlights.map((h) => (
                    <div key={h.sessionId} className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{h.topic}</span>
                          {h.improved && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Thinking improved</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 text-sm">{effortStars(h.avgEffort)}</span>
                          <span className="text-xs text-gray-400">{h.date}</span>
                        </div>
                      </div>
                      {h.firstMessage && h.lastMessage && h.firstMessage !== h.lastMessage && (
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                          <div>
                            <div className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-1">First question</div>
                            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border-l-3 border-orange-300">
                              &quot;{h.firstMessage}&quot;
                            </div>
                          </div>
                          <div className="text-gray-300 text-lg pt-6">&rarr;</div>
                          <div>
                            <div className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">Last question</div>
                            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border-l-3 border-green-300">
                              &quot;{h.lastMessage}&quot;
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topics Explored */}
            {stats && stats.topicBreakdown.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-4">Topics Explored</h2>
                <div className="flex flex-wrap gap-2">
                  {stats.topicBreakdown.map((t) => {
                    const colors = TOPIC_COLORS[t.category] || TOPIC_COLORS.exploration;
                    return (
                      <span key={t.category} className={`px-3 py-1.5 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                        {t.category.charAt(0).toUpperCase() + t.category.slice(1)} &times; {t.count}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Sessions */}
            <div>
              <h2 className="text-base font-semibold text-gray-500 mb-4">All Sessions</h2>
              {sessions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-gray-500">No sessions yet. Start a session above!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => {
                    const kidTurns = session.turns.filter((t) => t.role === "kid");
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{session.topic || "Untitled"}</span>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {kidTurns.length} turns &middot; {new Date(session.startedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          session.endedAt ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"
                        }`}>
                          {session.endedAt ? "Completed" : "Active"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Start session for non-filtered view */}
            {!selectedChild && children.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-500 mb-4">Start a Session</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleStartSession(child.id)}
                      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-green-300 hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                          {child.displayName[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{child.displayName}</span>
                      </div>
                      <span className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg">Start</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
