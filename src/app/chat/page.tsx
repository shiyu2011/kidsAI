"use client";

import { useEffect, useState } from "react";
import { getSessions } from "@/lib/api-client";
import Link from "next/link";

interface Session {
  id: string;
  topic: string | null;
  accessToken: string;
  startedAt: string;
  endedAt: string | null;
  turns: { role: string; content: string }[];
}

export default function KidChatEntry() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions()
      .then((data) => setSessions(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-lg font-bold text-blue-700">Your Sessions</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {loading ? (
            <div className="text-gray-400 text-sm px-4">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-gray-400 text-sm px-4">No previous sessions</div>
          ) : (
            sessions.map((session) => (
              <Link
                key={session.id}
                href={`/chat/${session.accessToken}`}
                className="block px-4 py-2 rounded-lg hover:bg-blue-50 transition text-left"
              >
                <div className="font-medium text-gray-900 truncate">
                  {session.topic || "Untitled"}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(session.startedAt).toLocaleDateString()} &middot; {session.endedAt ? "Completed" : "Active"}
                </div>
              </Link>
            ))
          )}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/chat/new"
            className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + New Session
          </Link>
        </div>
      </aside>
      {/* Main area: slot for chat */}
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-lg px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
            K
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome back!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Pick a session on the left to continue, or start a new one.
          </p>
        </div>
      </main>
    </div>
  );
}
