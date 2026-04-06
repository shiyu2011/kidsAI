"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, clearToken } from "@/lib/api-client";

interface ChildSummary {
  id: string;
  displayName: string;
  sessionCount: number;
  messageCount: number;
  avgEffort: number;
  recentTopics: string[];
}

interface ParentSummary {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  childCount: number;
  totalSessions: number;
  todaySessions: number;
  totalMessages: number;
  kidMessages: number;
  avgEffort: number;
  lastActive: string | null;
  children: ChildSummary[];
}

interface AdminData {
  global: {
    totalParents: number;
    totalChildren: number;
    totalSessions: number;
    totalMessages: number;
    todaySessions: number;
  };
  parents: ParentSummary[];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function effortBar(avg: number): string {
  if (avg >= 2.5) return "bg-green-500";
  if (avg >= 1.5) return "bg-yellow-500";
  if (avg >= 0.5) return "bg-orange-500";
  return "bg-gray-300";
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const token = localStorage.getItem("kidsai_token");
    fetch("/api/admin/overview", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Not authorized. Admin access required." : "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-pulse text-gray-400">Loading admin panel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button onClick={() => router.push("/dashboard")} className="text-blue-400 hover:underline">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">kidsAI <span className="text-red-400 text-sm font-normal ml-2">ADMIN</span></h1>
          <p className="text-sm text-gray-400">System Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-400 hover:text-white">
            Parent Dashboard
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">
            Log out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Global Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Parents</div>
            <div className="text-3xl font-bold">{data.global.totalParents}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Kids</div>
            <div className="text-3xl font-bold">{data.global.totalChildren}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sessions</div>
            <div className="text-3xl font-bold">{data.global.totalSessions}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Messages</div>
            <div className="text-3xl font-bold">{data.global.totalMessages}</div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Today</div>
            <div className="text-3xl font-bold text-green-400">{data.global.todaySessions}</div>
            <div className="text-xs text-gray-500 mt-1">sessions</div>
          </div>
        </div>

        {/* Parent Table */}
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">All Parents</h2>
          <div className="space-y-2">
            {data.parents.map((parent) => (
              <div key={parent.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedParent(expandedParent === parent.id ? null : parent.id)}
                  className="w-full p-4 text-left hover:bg-gray-750 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-gray-300">
                      {parent.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{parent.email}</span>
                        {parent.isAdmin && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">ADMIN</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Joined {new Date(parent.createdAt).toLocaleDateString()} &middot; {parent.childCount} kid{parent.childCount !== 1 ? "s" : ""} &middot; Last active: {timeAgo(parent.lastActive)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-white">{parent.totalSessions}</div>
                      <div className="text-[10px] text-gray-500">sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white">{parent.kidMessages}</div>
                      <div className="text-[10px] text-gray-500">kid msgs</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${effortBar(parent.avgEffort)}`} />
                        <span className="font-bold text-white">{parent.avgEffort}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">avg effort</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold ${parent.todaySessions > 0 ? "text-green-400" : "text-gray-600"}`}>
                        {parent.todaySessions}
                      </div>
                      <div className="text-[10px] text-gray-500">today</div>
                    </div>
                    <div className="text-gray-500">{expandedParent === parent.id ? "\u25B2" : "\u25BC"}</div>
                  </div>
                </button>

                {expandedParent === parent.id && parent.children.length > 0 && (
                  <div className="border-t border-gray-700 bg-gray-850 p-4">
                    <div className="grid gap-3">
                      {parent.children.map((child) => (
                        <div key={child.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {child.displayName[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white">{child.displayName}</div>
                              <div className="text-xs text-gray-500">
                                {child.sessionCount} sessions &middot; {child.messageCount} messages
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${effortBar(child.avgEffort)}`} />
                              <span className="text-sm font-medium text-gray-300">{child.avgEffort}/3</span>
                            </div>
                            {child.recentTopics.length > 0 && (
                              <div className="flex gap-1">
                                {child.recentTopics.slice(0, 3).map((topic, i) => (
                                  <span key={i} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full max-w-[120px] truncate">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {expandedParent === parent.id && parent.children.length === 0 && (
                  <div className="border-t border-gray-700 p-4 text-sm text-gray-500 text-center">
                    No children added yet
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
