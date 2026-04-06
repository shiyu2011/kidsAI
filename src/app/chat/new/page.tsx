"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createSession } from "@/lib/api-client";

export default function NewSessionPage() {
  const router = useRouter();

  useEffect(() => {
    // For now, just create a new session for the first available child (or fallback)
    // In a real app, you might want to let the kid pick their name/profile
    async function start() {
      // TODO: Replace with actual child selection logic if needed
      const children = await fetch("/api/children").then((r) => r.json());
      if (!children.length) {
        alert("No child profile found. Please ask your parent to add you.");
        router.push("/");
        return;
      }
      const { accessToken } = await createSession(children[0].id);
      router.push(`/chat/${accessToken}`);
    }
    start();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center max-w-lg px-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
          K
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Starting a new session...</h1>
        <p className="text-gray-500">Please wait.</p>
      </div>
    </div>
  );
}
